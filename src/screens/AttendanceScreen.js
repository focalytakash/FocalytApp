import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  FlatList,
  Modal,
} from 'react-native';



const { width } = Dimensions.get('window');

const AttendanceScreen = ({ navigation }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState('calendar'); // calendar, list, stats
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);


  // Sample attendance data - in real app, this would come from API
  const [attendanceData] = useState({
    '2025-07-01': { checkIn: '09:15', checkOut: '18:30', status: 'present', hours: '9h 15m', location: 'Office' },
    '2025-07-02': { checkIn: '09:00', checkOut: '18:00', status: 'present', hours: '9h 00m', location: 'Office' },
    '2025-07-03': { checkIn: '09:30', checkOut: '17:45', status: 'present', hours: '8h 15m', location: 'Office' },
    '2025-07-04': { checkIn: '10:00', checkOut: '19:00', status: 'late', hours: '9h 00m', location: 'Office' },
    '2025-07-05': { status: 'absent', hours: '0h 00m' },
    '2025-07-08': { checkIn: '08:45', checkOut: '17:30', status: 'present', hours: '8h 45m', location: 'Office' },
    '2025-07-09': { checkIn: '09:10', checkOut: '18:15', status: 'present', hours: '9h 05m', location: 'Office' },
    '2025-07-10': { checkIn: '09:20', checkOut: '18:45', status: 'present', hours: '9h 25m', location: 'Office' },
    '2025-07-11': { checkIn: '09:00', checkOut: '17:00', status: 'present', hours: '8h 00m', location: 'Office' },
    '2025-07-12': { checkIn: '10:30', checkOut: '18:00', status: 'late', hours: '7h 30m', location: 'Office' },
    '2025-07-15': { checkIn: '09:05', checkOut: '18:20', status: 'present', hours: '9h 15m', location: 'Office' },
    '2025-07-16': { checkIn: '09:30', checkOut: '--:--', status: 'present', hours: '8h 30m', location: 'Office' },
  });

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const getCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const days = [];
    for (let i = 0; i < 42; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      days.push(date);
    }
    return days;
  };

  const getAttendanceStatus = (date) => {
    const dateStr = date.toISOString().split('T')[0];
    return attendanceData[dateStr] || null;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'present': return '#10B981';
      case 'late': return '#F59E0B';
      case 'absent': return '#EF4444';
      default: return '#E5E7EB';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'present': return '✅';
      case 'late': return '⏰';
      case 'absent': return '❌';
      default: return '⚪';
    }
  };

  const getMonthlyStats = () => {
    const monthData = Object.entries(attendanceData).filter(([date]) => {
      const recordDate = new Date(date);
      return recordDate.getMonth() === currentMonth.getMonth() && 
             recordDate.getFullYear() === currentMonth.getFullYear();
    });

    const stats = {
      totalDays: monthData.length,
      present: monthData.filter(([_, data]) => data.status === 'present').length,
      late: monthData.filter(([_, data]) => data.status === 'late').length,
      absent: monthData.filter(([_, data]) => data.status === 'absent').length,
      totalHours: monthData.reduce((total, [_, data]) => {
        if (data.hours && data.hours !== '0h 00m') {
          const hours = parseFloat(data.hours.split('h')[0]);
          const minutes = parseFloat(data.hours.split('h')[1].split('m')[0]);
          return total + hours + (minutes / 60);
        }
        return total;
      }, 0),
    };

    return stats;
  };

  const renderCalendarDay = (date) => {
    const isCurrentMonth = date.getMonth() === currentMonth.getMonth();
    const isToday = date.toDateString() === new Date().toDateString();
    const isSelected = date.toDateString() === selectedDate.toDateString();
    const attendance = getAttendanceStatus(date);
    
    return (
      <TouchableOpacity
        key={date.toISOString()}
        style={[
          styles.calendarDay,
          !isCurrentMonth && styles.otherMonth,
          isToday && styles.today,
          isSelected && styles.selectedDay,
          attendance && { backgroundColor: getStatusColor(attendance.status) + '20' }
        ]}
        onPress={() => {
          setSelectedDate(date);
          if (attendance) {
            setSelectedRecord({ date, ...attendance });
            setShowDetailModal(true);
          }
        }}
      >
        <Text style={[
          styles.dayNumber,
          !isCurrentMonth && styles.otherMonthText,
          isToday && styles.todayText,
          isSelected && styles.selectedDayText
        ]}>
          {date.getDate()}
        </Text>
        {attendance && (
          <Text style={styles.statusIcon}>
            {getStatusIcon(attendance.status)}
          </Text>
        )}
      </TouchableOpacity>
    );
  };

  const renderListItem = ({ item }) => {
    const [dateStr, data] = item;
    const date = new Date(dateStr);
    
    return (
      <TouchableOpacity
        style={[styles.listItem, { borderLeftColor: getStatusColor(data.status) }]}
        onPress={() => {
          setSelectedRecord({ date, ...data });
          setShowDetailModal(true);
        }}
      >
        <View style={styles.listItemLeft}>
          <Text style={styles.listItemIcon}>{getStatusIcon(data.status)}</Text>
          <View>
            <Text style={styles.listItemDate}>
              {date.toLocaleDateString('en-US', { 
                weekday: 'short', 
                day: 'numeric', 
                month: 'short' 
              })}
            </Text>
            <Text style={styles.listItemStatus}>
              {data.status.charAt(0).toUpperCase() + data.status.slice(1)}
            </Text>
          </View>
        </View>
        <View style={styles.listItemRight}>
          <Text style={styles.listItemTime}>
            {data.checkIn ? `${data.checkIn} - ${data.checkOut}` : 'No Record'}
          </Text>
          <Text style={styles.listItemHours}>{data.hours}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderDetailModal = () => {
    if (!selectedRecord) return null;
    
    return (
      <Modal
        visible={showDetailModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowDetailModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Attendance Details</Text>
              <TouchableOpacity
                onPress={() => setShowDetailModal(false)}
                style={styles.closeButton}
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.modalBody}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Date:</Text>
                <Text style={styles.detailValue}>
                  {selectedRecord.date.toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    day: 'numeric', 
                    month: 'long', 
                    year: 'numeric' 
                  })}
                </Text>
              </View>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Status:</Text>
                <View style={styles.statusBadge}>
                  <Text style={styles.statusBadgeText}>
                    {getStatusIcon(selectedRecord.status)} {selectedRecord.status.toUpperCase()}
                  </Text>
                </View>
              </View>
              
              {selectedRecord.checkIn && (
                <>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Check In:</Text>
                    <Text style={styles.detailValue}>{selectedRecord.checkIn}</Text>
                  </View>
                  
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Check Out:</Text>
                    <Text style={styles.detailValue}>{selectedRecord.checkOut}</Text>
                  </View>
                  
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Total Hours:</Text>
                    <Text style={styles.detailValue}>{selectedRecord.hours}</Text>
                  </View>
                  
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Location:</Text>
                    <Text style={styles.detailValue}>{selectedRecord.location}</Text>
                  </View>
                </>
              )}
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  const stats = getMonthlyStats();

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>📊 Attendance History</Text>
            <Text style={styles.headerSubtitle}>Track your daily presence</Text>
          </View>
          <View style={styles.settingsButton}>
            <Text style={styles.settingsIcon}>📊</Text>
          </View>
        </View>
      </View>

      {/* View Mode Toggle */}
      <View style={styles.toggleContainer}>
        <TouchableOpacity
          style={[styles.toggleButton, viewMode === 'calendar' && styles.activeToggle]}
          onPress={() => setViewMode('calendar')}
        >
          <Text style={[styles.toggleText, viewMode === 'calendar' && styles.activeToggleText]}>
            📅 Calendar
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleButton, viewMode === 'list' && styles.activeToggle]}
          onPress={() => setViewMode('list')}
        >
          <Text style={[styles.toggleText, viewMode === 'list' && styles.activeToggleText]}>
            📋 List
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleButton, viewMode === 'stats' && styles.activeToggle]}
          onPress={() => setViewMode('stats')}
        >
          <Text style={[styles.toggleText, viewMode === 'stats' && styles.activeToggleText]}>
            📈 Stats
          </Text>
        </TouchableOpacity>
      </View>

      {/* Month Navigation */}
      <View style={styles.monthNavigation}>
        <TouchableOpacity
          style={styles.navButton}
          onPress={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))}
        >
          <Text style={styles.navButtonText}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.monthTitle}>
          {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
        </Text>
        <TouchableOpacity
          style={styles.navButton}
          onPress={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))}
        >
          <Text style={styles.navButtonText}>›</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Quick Stats */}
        <View style={styles.quickStats}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.present}</Text>
            <Text style={styles.statLabel}>Present</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.late}</Text>
            <Text style={styles.statLabel}>Late</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.absent}</Text>
            <Text style={styles.statLabel}>Absent</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.totalHours.toFixed(1)}h</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
        </View>

        {/* Calendar View */}
        {viewMode === 'calendar' && (
          <View style={styles.calendarContainer}>
            <View style={styles.weekHeader}>
              {weekDays.map(day => (
                <Text key={day} style={styles.weekDay}>{day}</Text>
              ))}
            </View>
            <View style={styles.calendarGrid}>
              {getCalendarDays().map(renderCalendarDay)}
            </View>
          </View>
        )}

        {/* List View */}
        {viewMode === 'list' && (
          <View style={styles.listContainer}>
            <FlatList
              data={Object.entries(attendanceData)
                .filter(([date]) => {
                  const recordDate = new Date(date);
                  return recordDate.getMonth() === currentMonth.getMonth() && 
                         recordDate.getFullYear() === currentMonth.getFullYear();
                })
                .sort(([a], [b]) => new Date(b) - new Date(a))}
              renderItem={renderListItem}
              keyExtractor={([date]) => date}
              scrollEnabled={false}
            />
          </View>
        )}

        {/* Stats View */}
        {viewMode === 'stats' && (
          <View style={styles.statsContainer}>
            <View style={styles.statsCard}>
              <Text style={styles.statsTitle}>📊 Monthly Overview</Text>
              <View style={styles.statsGrid}>
                <View style={styles.statRow}>
                  <View style={styles.statItem}>
                    <Text style={styles.statIcon}>📅</Text>
                    <Text style={styles.statValue}>{stats.totalDays}</Text>
                    <Text style={styles.statText}>Working Days</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={styles.statIcon}>⏰</Text>
                    <Text style={styles.statValue}>{stats.totalHours.toFixed(1)}</Text>
                    <Text style={styles.statText}>Total Hours</Text>
                  </View>
                </View>
                <View style={styles.statRow}>
                  <View style={styles.statItem}>
                    <Text style={styles.statIcon}>📈</Text>
                    <Text style={styles.statValue}>{((stats.present + stats.late) / stats.totalDays * 100).toFixed(1)}%</Text>
                    <Text style={styles.statText}>Attendance</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={styles.statIcon}>🎯</Text>
                    <Text style={styles.statValue}>{(stats.totalHours / (stats.totalDays * 8.5) * 100).toFixed(1)}%</Text>
                    <Text style={styles.statText}>Efficiency</Text>
                  </View>
                </View>
              </View>
            </View>

            <View style={styles.legend}>
              <Text style={styles.legendTitle}>Legend:</Text>
              <View style={styles.legendItems}>
                <View style={styles.legendItem}>
                  <Text style={styles.legendIcon}>✅</Text>
                  <Text style={styles.legendText}>Present</Text>
                </View>
                <View style={styles.legendItem}>
                  <Text style={styles.legendIcon}>⏰</Text>
                  <Text style={styles.legendText}>Late</Text>
                </View>
                <View style={styles.legendItem}>
                  <Text style={styles.legendIcon}>❌</Text>
                  <Text style={styles.legendText}>Absent</Text>
                </View>
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      {renderDetailModal()}


    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerContent: {
    flex: 1,
  },
  settingsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  settingsIcon: {
    fontSize: 18,
    color: '#1E293B',
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 24,
    color: '#1E293B',
    fontWeight: '800',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 4,
  },
  toggleContainer: {
    flexDirection: 'row',
    margin: 20,
    backgroundColor: '#E2E8F0',
    borderRadius: 15,
    padding: 4,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 12,
  },
  activeToggle: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  toggleText: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '600',
  },
  activeToggleText: {
    color: '#1E293B',
  },
  monthNavigation: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  navButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  navButtonText: {
    fontSize: 18,
    color: '#1E293B',
    fontWeight: '600',
  },
  monthTitle: {
    fontSize: 20,
    color: '#1E293B',
    fontWeight: '700',
  },
  scrollView: {
    flex: 1,
  },
  quickStats: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statNumber: {
    fontSize: 24,
    color: '#1E293B',
    fontWeight: '800',
  },
  statLabel: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
  },
  calendarContainer: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  weekHeader: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  weekDay: {
    flex: 1,
    textAlign: 'center',
    fontSize: 14,
    color: '#64748B',
    fontWeight: '600',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  calendarDay: {
    width: (width - 80) / 7,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    marginBottom: 4,
  },
  otherMonth: {
    opacity: 0.3,
  },
  today: {
    backgroundColor: '#3B82F6',
  },
  selectedDay: {
    backgroundColor: '#1E293B',
  },
  dayNumber: {
    fontSize: 16,
    color: '#1E293B',
    fontWeight: '600',
  },
  otherMonthText: {
    color: '#9CA3AF',
  },
  todayText: {
    color: '#FFFFFF',
  },
  selectedDayText: {
    color: '#FFFFFF',
  },
  statusIcon: {
    fontSize: 10,
    marginTop: 2,
  },
  listContainer: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    borderLeftWidth: 4,
    paddingLeft: 16,
  },
  listItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  listItemIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  listItemDate: {
    fontSize: 16,
    color: '#1E293B',
    fontWeight: '600',
  },
  listItemStatus: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  listItemRight: {
    alignItems: 'flex-end',
  },
  listItemTime: {
    fontSize: 14,
    color: '#1E293B',
    fontFamily: 'monospace',
  },
  listItemHours: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  statsContainer: {
    paddingHorizontal: 20,
  },
  statsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  statsTitle: {
    fontSize: 18,
    color: '#1E293B',
    fontWeight: '700',
    marginBottom: 20,
  },
  statsGrid: {
    gap: 16,
  },
  statRow: {
    flexDirection: 'row',
    gap: 16,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    padding: 16,
    borderRadius: 12,
  },
  statIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  statValue: {
    fontSize: 20,
    color: '#1E293B',
    fontWeight: '700',
  },
  statText: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
  },
  legend: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  legendTitle: {
    fontSize: 16,
    color: '#1E293B',
    fontWeight: '600',
    marginBottom: 12,
  },
  legendItems: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  legendItem: {
    alignItems: 'center',
  },
  legendIcon: {
    fontSize: 20,
  },
  legendText: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 0,
    width: width - 40,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  modalTitle: {
    fontSize: 18,
    color: '#1E293B',
    fontWeight: '700',
  },
  closeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    color: '#64748B',
  },
  modalBody: {
    padding: 20,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  detailLabel: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 16,
    color: '#1E293B',
    fontWeight: '600',
  },
  statusBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusBadgeText: {
    fontSize: 12,
    color: '#1E293B',
    fontWeight: '600',
  },
});

export default AttendanceScreen;