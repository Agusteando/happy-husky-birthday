import { ref, computed } from 'vue'
import dayjs from 'dayjs'

// Strict mapping layer bridging UI friendly names to documented Signia short codes
export const plantelUItoCode: Record<string, string> = {
  'Primaria Metepec': 'PM',
  'Primaria Toluca': 'PT',
  'Secundaria Metepec': 'SEM',
  'Secundaria Toluca': 'SE',
  'Casita Metepec': 'CM',
  'Casita Toluca': 'CT',
  'Desarrollo Metepec': 'DES',
  'Preescolar Toluca': 'PREET',
  'Preescolar Metepec': 'PREEM',
  'Corporativo': 'CO',
  'Dirección Académica': 'DCA',
  'General': 'GRAL',
  'Instituto Secundaria Toluca': 'IS',
  'Instituto Secundaria Metepec': 'ISM',
  'Externos e Invitados Especiales': 'EXT'
}

export const useEmployees = () => {
  const employees = ref<any[]>([])
  const loading = ref(false)
  const filterPlantel = ref('')
  const filterSearch = ref('')
  const heroFaces = ref<string[]>([])

  const fetchHeroFaces = async () => {
    try {
      const data: any = await $fetch('/api/employees/faces')
      heroFaces.value = data
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
    if (!resolvedCode) {
      console.error(`[DEBUG-HHB] Client Fetch - Unknown UI plantel selected: "${plantelName}"`)
      return
    }

    loading.value = true
    console.log(`[DEBUG-HHB] Client Fetch - UI Label: "${plantelName}" -> Resolved Internal Code: "${resolvedCode}"`)
    
    try {
      const fetchUrl = `/api/employees?plantelCode=${resolvedCode}`
      console.log(`[DEBUG-HHB] Client Fetch - Requesting Local Server Adapter: ${fetchUrl}`)
      
      const data: any = await $fetch(fetchUrl)
      console.log(`[DEBUG-HHB] Client Fetch - Received ${data?.length || 0} employees from Server Adapter.`)
      
      employees.value = data
    } catch (e) {
      console.error('[DEBUG-HHB] Client Fetch - Error retrieving employee data:', e)
    } finally {
      loading.value = false
    }
  }

  const filteredEmployees = computed(() => {
    return employees.value.filter((emp: any) => {
      const searchTxt = filterSearch.value.toLowerCase()
      const matchesSearch = !searchTxt || 
                            emp.name?.toLowerCase().includes(searchTxt) || 
                            emp.email?.toLowerCase().includes(searchTxt)
      return matchesSearch
    })
  })

  const stats = computed(() => {
    const list = employees.value
    const total = list.length
    if (total === 0) return null

    const withEmail = list.filter((e: any) => e.email).length
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
      withEmailPct: (withEmail / total * 100).toFixed(0),
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
      if (filterPlantel.value) await fetchEmployees(filterPlantel.value)
    } catch (e) {
      console.error('[DEBUG-HHB] Update Error', e)
    }
  }

  const deleteEmployee = async (id: string) => {
    if (!confirm('¿Estás seguro de ocultar a este colaborador de las celebraciones activas?')) return
    await updateEmployee(id, { baja: true })
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
      console.error('[DEBUG-HHB] Calendar Sync Error', e)
    }
  }

  const addExternalUser = async (user: any) => {
    try {
      await $fetch('/api/employees/add', { method: 'POST', body: user })
      if (filterPlantel.value === user.plantel || filterPlantel.value === 'Externos e Invitados Especiales') {
        await fetchEmployees(filterPlantel.value)
      }
    } catch (e) {
      console.error('[DEBUG-HHB] External User Creation Error', e)
    }
  }

  const exportExcel = () => {
    const csvRows = []
    const headers = ['Nombre', 'Email', 'Sede', 'Cumpleaños', 'Destacado']
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
    link.download = `directorio_celebraciones_${dayjs().format('YYYY-MM-DD')}.csv`
    link.click()
  }

  return {
    employees, loading, filterPlantel, filterSearch, heroFaces,
    filteredEmployees, stats,
    fetchEmployees, fetchHeroFaces, updateEmployee, deleteEmployee,
    toggleCalendarEvent, addExternalUser, exportExcel
  }
}