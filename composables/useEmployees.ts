import { ref, computed } from 'vue'
import dayjs from 'dayjs'

export const codeToUI: Record<string, string> = {
  ALL: "Todas las sedes (Global)",
  PT: "Primaria Toluca",
  PM: "Primaria Metepec",
  CT: "Casita Toluca",
  CM: "Casita Metepec",
  CO: "Casita Ocoyoacac",
  PREET: "Preescolar Toluca",
  PREEM: "Preescolar Metepec",
  SE: "Secundaria Toluca",
  SEM: "Secundaria Metepec",
  IS: "ISSSTE Toluca",
  ISM: "ISSSTE Metepec",
  DES: "Desarrollo Metepec",
  DCA: "Desarrollo Climaya",
  EXT: "Externos e Invitados Especiales"
}

export const plantelUItoCode: Record<string, string> = Object.fromEntries(
  Object.entries(codeToUI).map(([code, label]) => [label, code])
)

export const useEmployees = () => {
  const employees = ref<any[]>([])
  const loading = ref(false)
  const filterPlantel = ref('')
  const filterSearch = ref('')
  const heroFaces = ref<string[]>([])
  const globalBirthers = ref<any[]>([])

  const fetchHeroFaces = async () => {
    try {
      const data: any = await $fetch('/api/employees/faces')
      globalBirthers.value = data.todayBirthers || []
      
      const birtherFaces = globalBirthers.value.map(b => b.picture).filter(Boolean)
      
      if (birtherFaces.length > 0) {
        const combined = Array.from(new Set([...birtherFaces, ...(data.fallbackFaces || [])])).slice(0, 5)
        heroFaces.value = combined
      } else {
        heroFaces.value = data.fallbackFaces || []
      }
    } catch (e) {
      console.error('[DEBUG-HHB] Client Fetch - Could not load hero faces', e)
    }
  }

  const fetchEmployees = async (plantelName: string) => {
    if (!plantelName) {
      employees.value = []
      return
    }

    const resolvedCode = plantelUItoCode[plantelName]
    if (!resolvedCode) return

    loading.value = true
    
    try {
      const fetchUrl = `/api/employees?plantelCode=${resolvedCode}&plantelNameFallback=${encodeURIComponent(plantelName)}`
      const data: any = await $fetch(fetchUrl)
      employees.value = data
    } catch (e) {
      console.error('[DEBUG-HHB] Error fetching employees:', e)
    } finally {
      loading.value = false
    }
  }

  const filteredEmployees = computed(() => {
    const searchTxt = filterSearch.value.toLowerCase()
    const todayStr = dayjs().format('MM-DD')

    const baseFiltered = employees.value.filter((emp: any) => {
      return !searchTxt || 
             emp.name?.toLowerCase().includes(searchTxt) || 
             emp.email?.toLowerCase().includes(searchTxt)
    })

    return baseFiltered.sort((a, b) => {
      const aIsToday = a.birthday === todayStr
      const bIsToday = b.birthday === todayStr
      if (aIsToday && !bIsToday) return -1
      if (!aIsToday && bIsToday) return 1
      
      if (!a.birthday) return 1
      if (!b.birthday) return -1
      return a.birthday.localeCompare(b.birthday)
    })
  })

  const stats = computed(() => {
    const list = employees.value
    const total = list.length
    if (total === 0) return null

    const withEmail = list.filter((e: any) => e.email).length
    let thisMonthBdays = 0
    let todayBdays = 0
    const todayStr = dayjs().format('MM-DD')
    const currentMonth = dayjs().format('MM')

    list.forEach((e: any) => {
      if (e.birthday) {
        if (e.birthday === todayStr) {
          todayBdays++
        }
        if (e.birthday.startsWith(currentMonth)) {
          thisMonthBdays++
        }
      }
    })

    return {
      total,
      withEmailPct: (withEmail / total * 100).toFixed(0),
      thisMonthBdays,
      todayBdays
    }
  })

  const updateEmployee = async (id: string, payload: any) => {
    try {
      const index = employees.value.findIndex(e => e.id === id)
      if (index !== -1) {
        employees.value[index] = { ...employees.value[index], ...payload }
      }
      
      await $fetch('/api/employees/update', {
        method: 'PATCH',
        body: { id, ...payload }
      })
      await fetchHeroFaces()
    } catch (e) {
      console.error(e)
    }
  }

  const removeEmployee = async (emp: any, reason: string) => {
    try {
      await $fetch('/api/employees/remove', {
        method: 'POST',
        body: { employee_id: emp.id, employee_name: emp.name, reason }
      })
      employees.value = employees.value.filter(e => e.id !== emp.id)
    } catch (e) {
      console.error(e)
    }
  }

  const toggleCalendarEvent = async (emp: any) => {
    try {
      if (emp.event_id) {
        await $fetch('/api/calendar/event', { method: 'DELETE', body: { event_id: emp.event_id } })
        await updateEmployee(emp.id, { event_id: '' }) 
      } else {
        const res: any = await $fetch('/api/calendar/event', { 
          method: 'POST', 
          body: { title: `Cumpleaños de ${emp.name}`, date: emp.birthday, email: emp.email } 
        })
        await updateEmployee(emp.id, { event_id: res.eventId })
      }
    } catch (e) {
      console.error(e)
    }
  }

  const addExternalUser = async (user: any) => {
    try {
      await $fetch('/api/employees/add', { method: 'POST', body: user })
      if (filterPlantel.value === user.plantel || filterPlantel.value === codeToUI['EXT'] || filterPlantel.value === codeToUI['ALL']) {
        await fetchEmployees(filterPlantel.value)
      }
      await fetchHeroFaces()
    } catch (e) {
      console.error(e)
    }
  }

  const exportExcel = () => {
    const csvRows = []
    const headers = ['Nombre', 'Email', 'Sede', 'Cumpleaños', 'Destacado']
    csvRows.push(headers.join(','))

    // Privacy rule enforced on client: birthday is already stripped of year from server
    filteredEmployees.value.forEach((e: any) => {
      const row = [
        `"${e.name || ''}"`,
        `"${e.email || ''}"`,
        `"${e.plantel?.label || e.plantel?.name || e.plantel || ''}"`,
        `"${e.birthday || ''}"`,
        e.high_rank ? 'Si' : 'No'
      ]
      csvRows.push(row.join(','))
    })

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `directorio_celebraciones_${dayjs().format('YYYY-MM-DD')}.csv`
    link.click()
  }

  return {
    employees, loading, filterPlantel, filterSearch, heroFaces, globalBirthers,
    filteredEmployees, stats,
    fetchEmployees, fetchHeroFaces, updateEmployee, removeEmployee,
    toggleCalendarEvent, addExternalUser, exportExcel
  }
}