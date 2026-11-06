export default {
  template: `
  <div class="container mt-4">
    <!-- Navbar -->
    <nav class="navbar navbar-expand-lg navbar-dark bg-dark mb-4">
      <div class="container-fluid">
        <span class="navbar-brand">Admin Analytics</span>
        <div class="navbar-nav d-flex flex-row ms-auto">
          <router-link class="nav-link text-white me-3" to="/summary">Summary</router-link>
          <router-link class="nav-link text-white me-3" to="/Quizadmin">Quiz</router-link>
          <router-link class="nav-link text-white me-3" to="/admindashboard">Home</router-link>
          <a class="nav-link text-white" href="#" @click.prevent="logout">Logout</a>
        </div>
      </div>
    </nav>

    <!-- Loading State -->
    <div v-if="loading" class="text-center">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
      <p class="mt-2">Loading analytics dashboard...</p>
    </div>

    <!-- Main Content -->
    <div v-else>
      <!-- Page Title -->
      <div class="d-flex justify-content-between align-items-center mb-4">
        <h2><i class="bi bi-graph-up me-2"></i>Analytics Dashboard</h2>
        <!-- Removed refresh button and period selector for cleaner UI -->
      </div>

      <!-- Overview KPI Cards -->
      <div class="row mb-4">
        <div class="col-md-3 mb-3">
          <div class="card bg-primary text-white h-100">
            <div class="card-body text-center">
              <i class="bi bi-people-fill fs-1 mb-2"></i>
              <h3 class="card-title">{{ summary.totalUsers }}</h3>
              <p class="card-text">Total Users</p>
            </div>
          </div>
        </div>
        
        <div class="col-md-3 mb-3">
          <div class="card bg-success text-white h-100">
            <div class="card-body text-center">
              <i class="bi bi-clipboard-data fs-1 mb-2"></i>
              <h3 class="card-title">{{ summary.totalAttempts }}</h3>
              <p class="card-text">Quiz Attempts</p>
            </div>
          </div>
        </div>
        
        <div class="col-md-3 mb-3">
          <div class="card bg-info text-white h-100">
            <div class="card-body text-center">
              <i class="bi bi-trophy-fill fs-1 mb-2"></i>
              <h3 class="card-title">{{ summary.averageScore }}%</h3>
              <p class="card-text">Average Score</p>
            </div>
          </div>
        </div>
        
        <div class="col-md-3 mb-3">
          <div class="card bg-warning text-dark h-100">
            <div class="card-body text-center">
              <i class="bi bi-exclamation-triangle-fill fs-1 mb-2"></i>
              <h3 class="card-title">{{ getTotalFlagged() }}</h3>
              <p class="card-text">Flagged Items</p>
              <small v-if="getTotalFlagged() > 0">
                Needs attention
              </small>
            </div>
          </div>
        </div>
      </div>

      <!-- Charts Row 1 -->
      <div class="row mb-4">
        <!-- Quiz Attempts Trend -->
        <div class="col-md-8">
          <div class="card h-100">
            <div class="card-header bg-primary text-white">
              <h5 class="mb-0"><i class="bi bi-graph-up me-2"></i>Quiz Attempts Trend</h5>
            </div>
            <div class="card-body">
              <canvas ref="attemptsChart" width="400" height="200"></canvas>
            </div>
          </div>
        </div>

        <!-- Performance Distribution -->
        <div class="col-md-4">
          <div class="card h-100">
            <div class="card-header bg-success text-white">
              <h5 class="mb-0"><i class="bi bi-pie-chart me-2"></i>Score Distribution</h5>
            </div>
            <div class="card-body">
              <canvas ref="scoreChart" width="300" height="300"></canvas>
            </div>
          </div>
        </div>
      </div>

      <!-- Charts Row 2 -->
      <div class="row mb-4">
        <!-- Subject Performance -->
        <div class="col-md-6">
          <div class="card h-100">
            <div class="card-header bg-info text-white">
              <h5 class="mb-0"><i class="bi bi-bar-chart me-2"></i>Subject Performance</h5>
            </div>
            <div class="card-body">
              <canvas ref="subjectChart" width="400" height="300"></canvas>
            </div>
          </div>
        </div>

        <!-- User Activity Heatmap -->
        <div class="col-md-6">
          <div class="card h-100">
            <div class="card-header bg-warning text-dark">
              <h5 class="mb-0"><i class="bi bi-calendar-heat me-2"></i>Daily Activity</h5>
            </div>
            <div class="card-body">
              <canvas ref="activityChart" width="400" height="300"></canvas>
            </div>
          </div>
        </div>
      </div>

      <!-- Detailed Analytics -->
      <div class="row mb-4">
        <!-- Top Performers Table -->
        <div class="col-md-8">
          <div class="card h-100">
            <div class="card-header bg-dark text-white">
              <h5 class="mb-0"><i class="bi bi-trophy me-2"></i>Top Performers</h5>
            </div>
            <div class="card-body">
              <div class="table-responsive">
                <table class="table table-hover">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>User</th>
                      <th>Total Attempts</th>
                      <th>Average Score</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-if="topPerformers.length === 0">
                      <td colspan="4" class="text-center text-muted py-4">
                        No quiz attempts found yet.
                      </td>
                    </tr>
                    <tr v-for="(performer, index) in topPerformers" :key="performer.user_id">
                      <td>
                        <span class="badge" :class="index < 3 ? 'bg-warning' : 'bg-secondary'">
                          {{ index + 1 }}
                        </span>
                      </td>
                      <td>
                        <strong>{{ performer.user_name }}</strong>
                        <span v-if="performer.is_flagged" class="badge bg-danger ms-2">Flagged</span>
                      </td>
                      <td>{{ performer.total_attempts }}</td>
                      <td>
                        <span class="badge" :class="performer.average_score >= 80 ? 'bg-success' : performer.average_score >= 60 ? 'bg-warning' : 'bg-danger'">
                          {{ performer.average_score }}%
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        <!-- Quick Stats -->
        <div class="col-md-4">
          <div class="card h-100">
            <div class="card-header bg-secondary text-white">
              <h5 class="mb-0"><i class="bi bi-speedometer2 me-2"></i>Quick Stats</h5>
            </div>
            <div class="card-body">
              <div class="row text-center mb-3">
                <div class="col-6">
                  <div class="border rounded p-2">
                    <h4 class="text-primary">{{ summary.totalSubjects }}</h4>
                    <small class="text-muted">Subjects</small>
                  </div>
                </div>
                <div class="col-6">
                  <div class="border rounded p-2">
                    <h4 class="text-success">{{ summary.totalChapters }}</h4>
                    <small class="text-muted">Chapters</small>
                  </div>
                </div>
              </div>
              <div class="row text-center mb-3">
                <div class="col-6">
                  <div class="border rounded p-2">
                    <h4 class="text-info">{{ summary.totalQuizzes }}</h4>
                    <small class="text-muted">Quizzes</small>
                  </div>
                </div>
                <div class="col-6">
                  <div class="border rounded p-2">
                    <h4 class="text-warning">{{ summary.totalQuestions }}</h4>
                    <small class="text-muted">Questions</small>
                  </div>
                </div>
              </div>
              
              <!-- Content Overview -->
              <hr>
              <h6 class="mb-3">Content Overview</h6>
              <div class="mb-2">
                <div class="d-flex justify-content-between">
                  <span>Active Content</span>
                  <span class="badge bg-success">
                    {{ summary.totalQuestions > 0 ? 'Available' : 'None' }}
                  </span>
                </div>
              </div>
              <div class="mb-2">
                <div class="d-flex justify-content-between">
                  <span>Platform Usage</span>
                  <span class="badge" :class="summary.totalAttempts > 0 ? 'bg-success' : 'bg-secondary'">
                    {{ summary.totalAttempts > 0 ? 'Active' : 'Inactive' }}
                  </span>
                </div>
              </div>
              <div class="mb-2">
                <div class="d-flex justify-content-between">
                  <span>Flagged Items</span>
                  <span class="badge" :class="getTotalFlagged() > 0 ? 'bg-warning' : 'bg-success'">
                    {{ getTotalFlagged() || 'None' }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Recent Activity Timeline -->
      <div class="row">
        <div class="col-md-12">
          <div class="card">
            <div class="card-header bg-dark text-white">
              <h5 class="mb-0"><i class="bi bi-clock-history me-2"></i>Recent Activity Timeline</h5>
            </div>
            <div class="card-body">
              <div v-if="recentAttempts.length === 0" class="text-center text-muted py-4">
                <p>No recent quiz attempts found.</p>
              </div>
              <div v-else class="timeline">
                <div v-for="attempt in recentAttempts.slice(0, 10)" :key="attempt.id" class="timeline-item mb-3">
                  <div class="row align-items-center">
                    <div class="col-md-2 text-muted small">
                      {{ formatTime(attempt.timestamp) }}
                    </div>
                    <div class="col-md-3">
                      <strong>{{ attempt.user_name }}</strong>
                    </div>
                    <div class="col-md-4">
                      <span class="text-muted">{{ attempt.subject_name }}</span> - 
                      <span class="text-info">{{ attempt.chapter_name }}</span>
                    </div>
                    <div class="col-md-3 text-end">
                      <span class="badge" :class="getScoreBadgeClass(attempt.score, attempt.total_questions)">
                        {{ attempt.score }}/{{ attempt.total_questions }} 
                        ({{ Math.round((attempt.score/attempt.total_questions)*100) }}%)
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  `,

  data() {
    return {
      loading: true,
      summary: {
        totalUsers: 0,
        totalSubjects: 0,
        totalChapters: 0,
        totalQuizzes: 0,
        totalQuestions: 0,
        totalAttempts: 0,
        averageScore: 0,
        flaggedUsers: 0,
        flaggedSubjects: 0,
        flaggedQuizzes: 0,
        flaggedQuestions: 0
      },
      recentAttempts: [],
      topPerformers: [],
      subjectStats: [],
      chartInstances: {},
      attemptsData: [],
      scoreDistribution: []
    };
  },

  async mounted() {
    await this.loadAnalyticsData();
  },

  beforeUnmount() {
    // Destroy chart instances to prevent memory leaks
    Object.values(this.chartInstances).forEach(chart => {
      if (chart) chart.destroy();
    });
  },

  methods: {
    checkAuth() {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        alert('No authentication token found. Please login again.');
        this.$router.push('/login');
        return false;
      }
      return true;
    },

    async loadAnalyticsData() {
      if (!this.checkAuth()) return;
      
      this.loading = true;
      
      try {
        // Load all data sequentially to ensure proper order
        await this.fetchSummaryStats();
        await this.fetchRecentAttempts();
        await this.fetchTopPerformers();
        
        // Generate chart data based on real data
        this.generateChartData();
        
        // Wait for DOM update then initialize charts
        await this.$nextTick();
        this.initializeCharts();
        
      } catch (error) {
        console.error('Error loading analytics data:', error);
        alert('Failed to load analytics data. Please try again.');
      } finally {
        this.loading = false;
      }
    },

    async fetchSummaryStats() {
      const token = localStorage.getItem('auth_token');
      
      try {
        const response = await fetch('/api/admin/summary-stats', {
          headers: { 'Authentication-Token': token }
        });
        
        if (response.status === 401) {
          localStorage.removeItem('auth_token');
          this.$router.push('/login');
          return;
        }
        
        if (!response.ok) throw new Error('Failed to fetch summary stats');
        
        const data = await response.json();
        this.summary = { ...this.summary, ...data.summary };
        this.subjectStats = data.subjectStats || [];
      } catch (error) {
        console.error('Error fetching summary stats:', error);
      }
    },

    async fetchRecentAttempts() {
      const token = localStorage.getItem('auth_token');
      
      try {
        const response = await fetch('/api/admin/recent-attempts', {
          headers: { 'Authentication-Token': token }
        });
        
        if (response.ok) {
          this.recentAttempts = await response.json();
        }
      } catch (error) {
        console.error('Error fetching recent attempts:', error);
        this.recentAttempts = [];
      }
    },

    async fetchTopPerformers() {
      const token = localStorage.getItem('auth_token');
      
      try {
        const response = await fetch('/api/admin/top-performers', {
          headers: { 'Authentication-Token': token }
        });
        
        if (response.ok) {
          this.topPerformers = await response.json();
        }
      } catch (error) {
        console.error('Error fetching top performers:', error);
        this.topPerformers = [];
      }
    },

    generateChartData() {
      
      const today = new Date();
      const days = 7;
      this.attemptsData = [];
      
     
      if (this.recentAttempts.length > 0) {
        for (let i = days - 1; i >= 0; i--) {
          const date = new Date(today);
          date.setDate(date.getDate() - i);
          const dateStr = date.toLocaleDateString();
          
          const dayAttempts = this.recentAttempts.filter(attempt => {
            const attemptDate = new Date(attempt.timestamp).toLocaleDateString();
            return attemptDate === dateStr;
          }).length;
          
          this.attemptsData.push({
            date: dateStr,
            attempts: dayAttempts
          });
        }
      } else {
    
        const avgPerDay = Math.ceil(this.summary.totalAttempts / days);
        for (let i = days - 1; i >= 0; i--) {
          const date = new Date(today);
          date.setDate(date.getDate() - i);
          const dateStr = date.toLocaleDateString();
          
          this.attemptsData.push({
            date: dateStr,
            attempts: i === 0 ? this.summary.totalAttempts - (avgPerDay * (days - 1)) : avgPerDay
          });
        }
      }

    
      if (this.recentAttempts.length > 0) {
        const ranges = [
          { range: '90-100%', min: 90, max: 100, count: 0 },
          { range: '80-89%', min: 80, max: 89, count: 0 },
          { range: '70-79%', min: 70, max: 79, count: 0 },
          { range: '60-69%', min: 60, max: 69, count: 0 },
          { range: 'Below 60%', min: 0, max: 59, count: 0 }
        ];

        this.recentAttempts.forEach(attempt => {
          const percentage = Math.round((attempt.score / attempt.total_questions) * 100);
          ranges.forEach(range => {
            if (percentage >= range.min && percentage <= range.max) {
              range.count++;
            }
          });
        });

        this.scoreDistribution = ranges;
      } else if (this.summary.totalAttempts > 0) {
  
        const avgScore = this.summary.averageScore;
        const totalAttempts = this.summary.totalAttempts;
        
        this.scoreDistribution = [
          { range: '90-100%', count: avgScore >= 90 ? Math.ceil(totalAttempts * 0.2) : Math.ceil(totalAttempts * 0.1) },
          { range: '80-89%', count: avgScore >= 80 ? Math.ceil(totalAttempts * 0.3) : Math.ceil(totalAttempts * 0.2) },
          { range: '70-79%', count: Math.ceil(totalAttempts * 0.3) },
          { range: '60-69%', count: Math.ceil(totalAttempts * 0.2) },
          { range: 'Below 60%', count: avgScore < 60 ? Math.ceil(totalAttempts * 0.3) : Math.ceil(totalAttempts * 0.1) }
        ];
      } else {
       
        this.scoreDistribution = [
          { range: '90-100%', count: 0 },
          { range: '80-89%', count: 0 },
          { range: '70-79%', count: 0 },
          { range: '60-69%', count: 0 },
          { range: 'Below 60%', count: 0 }
        ];
      }
    },

    initializeCharts() {
      if (typeof Chart === 'undefined') {
        console.error('Chart.js is not loaded');
        return;
      }

      setTimeout(() => {
        this.createAttemptsChart();
        this.createScoreChart();
        this.createSubjectChart();
        this.createActivityChart();
      }, 100);
    },

    createAttemptsChart() {
      const ctx = this.$refs.attemptsChart?.getContext('2d');
      if (!ctx) return;

      if (this.chartInstances.attempts) {
        this.chartInstances.attempts.destroy();
      }

      this.chartInstances.attempts = new Chart(ctx, {
        type: 'line',
        data: {
          labels: this.attemptsData.map(d => d.date),
          datasets: [{
            label: 'Quiz Attempts',
            data: this.attemptsData.map(d => d.attempts),
            borderColor: 'rgb(54, 162, 235)',
            backgroundColor: 'rgba(54, 162, 235, 0.1)',
            tension: 0.4,
            fill: true
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: false
            }
          },
          scales: {
            y: {
              beginAtZero: true
            }
          }
        }
      });
    },

    createScoreChart() {
      const ctx = this.$refs.scoreChart?.getContext('2d');
      if (!ctx) return;

      if (this.chartInstances.score) {
        this.chartInstances.score.destroy();
      }

  
      const hasData = this.scoreDistribution.some(d => d.count > 0);
      
      this.chartInstances.score = new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: hasData ? this.scoreDistribution.map(d => d.range) : ['No Data'],
          datasets: [{
            data: hasData ? this.scoreDistribution.map(d => d.count) : [1],
            backgroundColor: hasData ? [
              '#28a745',
              '#20c997',
              '#ffc107',
              '#fd7e14',
              '#dc3545'
            ] : ['#e9ecef']
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'bottom'
            }
          }
        }
      });
    },

    createSubjectChart() {
      const ctx = this.$refs.subjectChart?.getContext('2d');
      if (!ctx) return;

      if (this.chartInstances.subject) {
        this.chartInstances.subject.destroy();
      }

      const subjectData = this.subjectStats.slice(0, 8);

      this.chartInstances.subject = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: subjectData.length > 0 ? subjectData.map(s => s.name) : ['No Subjects'],
          datasets: [{
            label: 'Chapters',
            data: subjectData.length > 0 ? subjectData.map(s => s.chapters) : [0],
            backgroundColor: subjectData.length > 0 ? 
              subjectData.map(s => s.is_flagged ? '#dc3545' : '#28a745') : 
              ['#e9ecef']
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: false
            }
          },
          scales: {
            y: {
              beginAtZero: true
            }
          }
        }
      });
    },

    createActivityChart() {
      const ctx = this.$refs.activityChart?.getContext('2d');
      if (!ctx) return;

      if (this.chartInstances.activity) {
        this.chartInstances.activity.destroy();
      }

      
      const hours = Array.from({length: 24}, (_, i) => `${i}:00`);
      let hourlyData = new Array(24).fill(0);

      if (this.recentAttempts.length > 0) {
        
        this.recentAttempts.forEach(attempt => {
          const hour = new Date(attempt.timestamp).getHours();
          hourlyData[hour]++;
        });
      } else if (this.summary.totalAttempts > 0) {
        
        const peakHours = [9, 10, 11, 12, 13, 14, 15, 16, 17];
        const attemptsPerPeakHour = Math.ceil(this.summary.totalAttempts * 0.7 / peakHours.length);
        const attemptsPerOffHour = Math.ceil(this.summary.totalAttempts * 0.3 / (24 - peakHours.length));
        
        hourlyData = hourlyData.map((_, index) => {
          return peakHours.includes(index) ? attemptsPerPeakHour : attemptsPerOffHour;
        });
      }

      this.chartInstances.activity = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: hours,
          datasets: [{
            label: 'Activity',
            data: hourlyData,
            backgroundColor: 'rgba(255, 193, 7, 0.8)'
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: false
            }
          },
          scales: {
            y: {
              beginAtZero: true
            }
          }
        }
      });
    },

    getTotalFlagged() {
      return this.summary.flaggedUsers + this.summary.flaggedSubjects + 
             this.summary.flaggedQuizzes + this.summary.flaggedQuestions;
    },

    getScoreBadgeClass(score, total) {
      const percentage = (score / total) * 100;
      if (percentage >= 80) return 'bg-success';
      if (percentage >= 60) return 'bg-warning';
      return 'bg-danger';
    },

    formatTime(dateString) {
      if (!dateString) return 'N/A';
      return new Date(dateString).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    },

    formatDate(dateString) {
      if (!dateString) return 'N/A';
      return new Date(dateString).toLocaleDateString() + ' ' + 
             new Date(dateString).toLocaleTimeString();
    },

    logout() {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
      this.$router.push('/login');
    }
  }
};