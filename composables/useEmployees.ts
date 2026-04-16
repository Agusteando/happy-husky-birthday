import { ref, computed } from 'vue'
import dayjs from 'dayjs'

export const useEmployees = () => {
  const employees = ref([])
  const loading = ref(true)
  const filterPlantel = ref('')
  const filterSearch = ref('')

  const fetchEmployees = async () => {
    loading.value = true
    try {
      const data = await $fetch('/api/employees')
      employees.value = data
    } catch (e) {
      console.error(e)
    } finally {
      loading.value = false
    }
  }

  const filteredEmployees = computed(() => {
    return employees.value.filter((emp: any) => {
      const matchesPlantel = !filterPlantel.value || emp.plantel?.name === filterPlantel.value || emp.plantel === filterPlantel.value
      const searchTxt = filterSearch.value.toLowerCase()
      const matchesSearch = !searchTxt || 
                            emp.name?.toLowerCase().includes(searchTxt) || 
                            emp.email?.toLowerCase().includes(searchTxt)
      return matchesPlantel && matchesSearch
    })
  })

  const stats = computed(() => {
    const list = employees.value
    const total = list.length
    const withEmail = list.filter((e: any) => e.email).length
    const incomplete = total - withEmail

    let validAges = 0
    let totalAge = 0
    let todayBdays = 0

    const todayStr = dayjs().format('MM-DD')

    list.forEach((e: any) => {
      if (e.birthday) {
        const bdate = dayjs(e.birthday)
        if (bdate.isValid()) {
          totalAge += dayjs().diff(bdate, 'year')
          validAges++
          if (bdate.format('MM-DD') === todayStr) {
            todayBdays++
          }
        }
      }
    })

    return {
      total,
      withEmail,
      incomplete,
      withEmailPct: total ? (withEmail / total * 100).toFixed(1) : 0,
      incompletePct: total ? (incomplete / total * 100).toFixed(1) : 0,
      avgAge: validAges ? Math.round(totalAge / validAges) : 0,
      todayBdays
    }
  })

  const updateEmployee = async (id: string, payload: any) => {
    try {
      await $fetch('/api/employees/update', {
        method: 'PATCH',
        body: { id, ...payload }
      })
      await fetchEmployees()
    } catch (e) {
      console.error('Update failed', e)
    }
  }

  const deleteEmployee = async (id: string) => {
    if (!confirm('¿Estás seguro de dar de baja a este empleado?')) return
    await updateEmployee(id, { baja: true })
  }

  const toggleCalendarEvent = async (emp: any) => {
    try {
      if (emp.event_id) {
        await $fetch('/api/calendar/event', { method: 'DELETE', body: { event_id: emp.event_id } })
        await updateEmployee(emp.id, { event_id: '' }) // Clear locally
      } else {
        const res: any = await $fetch('/api/calendar/event', { 
          method: 'POST', 
          body: { title: `Cumpleaños de ${emp.name}`, date: emp.birthday, email: emp.email } 
        })
        await updateEmployee(emp.id, { event_id: res.eventId })
      }
    } catch (e) {
      console.error('Calendar error', e)
    }
  }

  const addExternalUser = async (user: any) => {
    try {
      await $fetch('/api/employees/add', { method: 'POST', body: user })
      await fetchEmployees()
    } catch (e) {
      console.error('Failed adding user', e)
    }
  }

  const exportExcel = () => {
    const csvRows = []
    const headers = ['Nombre', 'Email', 'Plantel', 'Cumpleaños', 'Estrella']
    csvRows.push(headers.join(','))

    filteredEmployees.value.forEach((e: any) => {
      const row = [
        `"${e.name || ''}"`,
        `"${e.email || ''}"`,
        `"${e.plantel?.name || e.plantel || ''}"`,
        `"${e.birthday || ''}"`,
        e.high_rank ? 'Si' : 'No'
      ]
      csvRows.push(row.join(','))
    })

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `empleados_${dayjs().format('YYYY-MM-DD')}.csv`
    link.click()
  }

  return {
    employees, loading, filterPlantel, filterSearch,
    filteredEmployees, stats,
    fetchEmployees, updateEmployee, deleteEmployee,
    toggleCalendarEvent, addExternalUser, exportExcel
  }
}