
export default {
    props: ['userStats'],
    template: `
    <div class="container-fluid py-4">
        <!-- Header Section -->
        <div class="row mb-4">
            <div class="col-12">
                <div class="card bg-primary text-white shadow-lg">
                    <div class="card-body">
                        <div class="row align-items-center">
                            <div class="col-md-8">
                                <h2 class="mb-2">
                                    <i class="fas fa-chart-line me-3"></i>Performance Analytics
                                </h2>
                                
                            </div>
                            <div class="col-md-4 text-end">
                                <div class="h4 mb-0">{{ userStats.total_attempts || 0 }} Total Attempts</div>
                                <small class="opacity-75">{{ userStats.average_score || 0}}% Average Score</small>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Quick Stats Cards -->
        <div class="row mb-4">
            <div class="col-lg-3 col-md-6 mb-3">
                <div class="card border-0 shadow-sm h-100">
                    <div class="card-body text-center">
                        <div class="text-primary mb-2">
                            <i class="fas fa-clipboard-check fa-3x"></i>
                        </div>
                        <h4 class="fw-bold text-dark">{{ userStats.total_attempts || 0 }}</h4>
                        <p class="text-muted mb-0">Total Attempts</p>
                    </div>
                </div>
            </div>
            <div class="col-lg-3 col-md-6 mb-3">
                <div class="card border-0 shadow-sm h-100">
                    <div class="card-body text-center">
                        <div class="text-success mb-2">
                            <i class="fas fa-percentage fa-3x"></i>
                        </div>
                        <h4 class="fw-bold text-dark">{{ userStats.average_score || 0 }}%</h4>
                        <p class="text-muted mb-0">Average Score</p>
                    </div>
                </div>
            </div>
            <div class="col-lg-3 col-md-6 mb-3">
                <div class="card border-0 shadow-sm h-100">
                    <div class="card-body text-center">
                        <div class="text-warning mb-2">
                            <i class="fas fa-trophy fa-3x"></i>
                        </div>
                        <h4 class="fw-bold text-dark">{{ getBestScore() }}</h4>
                        <p class="text-muted mb-0">Best Score</p>
                    </div>
                </div>
            </div>
            <div class="col-lg-3 col-md-6 mb-3">
                <div class="card border-0 shadow-sm h-100">
                    <div class="card-body text-center">
                        <div class="text-info mb-2">
                            <i class="fas fa-book fa-3x"></i>
                        </div>
                        <h4 class="fw-bold text-dark">{{ getUniqueSubjects() }}</h4>
                        <p class="text-muted mb-0">Subjects Covered</p>
                    </div>
                </div>
            </div>
        </div>

        <!-- Charts Section -->
        <div class="row mb-4">
            <!-- Subject-wise Performance Pie Chart -->
            <div class="col-lg-6 mb-4">
                <div class="card border-0 shadow-sm h-100">
                    <div class="card-header bg-white border-0 py-3">
                        <h5 class="card-title mb-0">
                            <i class="fas fa-chart-pie text-primary me-2"></i>
                            Subject-wise Attempts
                        </h5>
                    </div>
                    <div class="card-body">
                        <div class="chart-container" style="height: 300px;">
                            <canvas ref="subjectChart"></canvas>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Performance Score Distribution -->
            <div class="col-lg-6 mb-4">
                <div class="card border-0 shadow-sm h-100">
                    <div class="card-header bg-white border-0 py-3">
                        <h5 class="card-title mb-0">
                            <i class="fas fa-chart-bar text-success me-2"></i>
                            Score Distribution
                        </h5>
                    </div>
                    <div class="card-body">
                        <div class="chart-container" style="height: 300px;">
                            <canvas ref="scoreChart"></canvas>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Monthly Activity Line Chart -->
        <div class="row mb-4">
            <div class="col-12">
                <div class="card border-0 shadow-sm">
                    <div class="card-header bg-white border-0 py-3">
                        <h5 class="card-title mb-0">
                            <i class="fas fa-chart-line text-info me-2"></i>
                            Monthly Activity Trend
                        </h5>
                    </div>
                    <div class="card-body">
                        <div class="chart-container" style="height: 350px;">
                            <canvas ref="activityChart"></canvas>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Subject Performance Table -->
        <div class="row mb-4">
            <div class="col-12">
                <div class="card border-0 shadow-sm">
                    <div class="card-header bg-white border-0 py-3">
                        <h5 class="card-title mb-0">
                            <i class="fas fa-table text-warning me-2"></i>
                            Detailed Subject Performance
                        </h5>
                    </div>
                    <div class="card-body">
                        <div v-if="userStats.subject_wise_performance && userStats.subject_wise_performance.length > 0" 
                             class="table-responsive">
                            <table class="table table-hover">
                                <thead class="table-light">
                                    <tr>
                                        <th><i class="fas fa-book me-1"></i>Subject</th>
                                        <th><i class="fas fa-clipboard-check me-1"></i>Attempts</th>
                                        <th><i class="fas fa-percentage me-1"></i>Average Score</th>
                                        <th><i class="fas fa-quiz me-1"></i>Unique Quizzes</th>
                                        <th><i class="fas fa-chart-bar me-1"></i>Performance</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr v-for="subject in userStats.subject_wise_performance" :key="subject.subject">
                                        <td class="fw-bold">{{ subject.subject }}</td>
                                        <td>
                                            <span class="badge bg-primary">{{ subject.attempts }}</span>
                                        </td>
                                        <td>{{ subject.average_score }}%</td>
                                        <td>{{ subject.unique_quizzes }}</td>
                                        <td>
                                            <div class="progress" style="height: 20px;">
                                                <div class="progress-bar" 
                                                     :class="getPerformanceClass(subject.average_score)"
                                                     :style="'width: ' + subject.average_score + '%'">
                                                    {{ subject.average_score }}%
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                        <div v-else class="text-center py-4">
                            <i class="fas fa-info-circle fa-3x text-muted mb-3"></i>
                            <h5 class="text-muted">No performance data available</h5>
                            <p class="text-muted">Take some quizzes to see your performance summary here!</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Recent Attempts -->
        <div class="row">
            <div class="col-12">
                <div class="card border-0 shadow-sm">
                    <div class="card-header bg-white border-0 py-3">
                        <h5 class="card-title mb-0">
                            <i class="fas fa-history text-secondary me-2"></i>
                            Recent Quiz Attempts
                        </h5>
                    </div>
                    <div class="card-body">
                        <div v-if="userStats.recent_attempts && userStats.recent_attempts.length > 0">
                            <div class="row">
                                <div v-for="attempt in userStats.recent_attempts" :key="attempt.quiz_id + attempt.attempt_date" 
                                     class="col-lg-4 col-md-6 mb-3">
                                    <div class="card border-start border-4" 
                                         :class="'border-' + getScoreColor(attempt.percentage)">
                                        <div class="card-body">
                                            <div class="d-flex justify-content-between align-items-start mb-2">
                                                <h6 class="card-title text-primary mb-0">{{ attempt.subject }}</h6>
                                                <span class="badge" :class="'bg-' + getScoreColor(attempt.percentage)">
                                                    {{ attempt.percentage }}%
                                                </span>
                                            </div>
                                            <p class="card-text text-muted small mb-2">{{ attempt.chapter }}</p>
                                            <div class="d-flex justify-content-between text-sm">
                                                <span><i class="fas fa-check-circle me-1"></i>{{ attempt.score }}/{{ attempt.total_questions }}</span>
                                                <span class="text-muted">{{ attempt.attempt_date }}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div v-else class="text-center py-4">
                            <i class="fas fa-clock fa-3x text-muted mb-3"></i>
                            <h5 class="text-muted">No recent attempts</h5>
                            <p class="text-muted">Your recent quiz attempts will appear here.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    `,

    data() {
        return {
            charts: {
                subject: null,
                score: null,
                activity: null
            }
        }
    },

    mounted() {
        this.$nextTick(() => {
            this.initializeCharts();
        });
    },

    beforeUnmount() {
       
        Object.values(this.charts).forEach(chart => {
            if (chart) {
                chart.destroy();
            }
        });
    },

    methods: {
        initializeCharts() {
            this.createSubjectChart();
            this.createScoreDistributionChart();
            this.createActivityChart();
        },

        createSubjectChart() {
            if (!this.userStats.subject_wise_performance || this.userStats.subject_wise_performance.length === 0) {
                return;
            }

            const ctx = this.$refs.subjectChart.getContext('2d');
            
            const subjects = this.userStats.subject_wise_performance.map(item => item.subject);
            const attempts = this.userStats.subject_wise_performance.map(item => item.attempts);
            
            const colors = [
                '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
                '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
            ];

            this.charts.subject = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: subjects,
                    datasets: [{
                        data: attempts,
                        backgroundColor: colors.slice(0, subjects.length),
                        borderWidth: 2,
                        borderColor: '#fff',
                        hoverBorderWidth: 3
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'bottom',
                            labels: {
                                padding: 20,
                                usePointStyle: true
                            }
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                    const percentage = ((context.parsed / total) * 100).toFixed(1);
                                    return `${context.label}: ${context.parsed} attempts (${percentage}%)`;
                                }
                            }
                        }
                    }
                }
            });
        },

        createScoreDistributionChart() {
            if (!this.userStats.subject_wise_performance || this.userStats.subject_wise_performance.length === 0) {
                return;
            }

            const ctx = this.$refs.scoreChart.getContext('2d');
            
            const subjects = this.userStats.subject_wise_performance.map(item => item.subject);
            const scores = this.userStats.subject_wise_performance.map(item => item.average_score);

            this.charts.score = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: subjects,
                    datasets: [{
                        label: 'Average Score (%)',
                        data: scores,
                        backgroundColor: scores.map(score => {
                            if (score >= 80) return '#28a745';
                            if (score >= 60) return '#ffc107';
                            return '#dc3545';
                        }),
                        borderRadius: 6,
                        borderSkipped: false,
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: false
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    return `Average Score: ${context.parsed.y}%`;
                                }
                            }
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            max: 100,
                            grid: {
                                color: '#f8f9fa'
                            },
                            ticks: {
                                callback: function(value) {
                                    return value + '%';
                                }
                            }
                        },
                        x: {
                            grid: {
                                display: false
                            }
                        }
                    }
                }
            });
        },

        createActivityChart() {
            if (!this.userStats.monthly_activity || this.userStats.monthly_activity.length === 0) {
                return;
            }

            const ctx = this.$refs.activityChart.getContext('2d');
            
            const months = this.userStats.monthly_activity.map(item => {
                const [year, month] = item.month.split('-');
                return new Date(year, month - 1).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
            });
            const attempts = this.userStats.monthly_activity.map(item => item.attempts);
            const avgScores = this.userStats.monthly_activity.map(item => item.average_score);

            this.charts.activity = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: months,
                    datasets: [
                        {
                            label: 'Quiz Attempts',
                            data: attempts,
                            borderColor: '#007bff',
                            backgroundColor: 'rgba(0, 123, 255, 0.1)',
                            borderWidth: 3,
                            fill: true,
                            tension: 0.4,
                            yAxisID: 'y'
                        },
                        {
                            label: 'Average Score (%)',
                            data: avgScores,
                            borderColor: '#28a745',
                            backgroundColor: 'rgba(40, 167, 69, 0.1)',
                            borderWidth: 3,
                            fill: false,
                            tension: 0.4,
                            yAxisID: 'y1'
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    interaction: {
                        mode: 'index',
                        intersect: false,
                    },
                    plugins: {
                        legend: {
                            position: 'top',
                        }
                    },
                    scales: {
                        y: {
                            type: 'linear',
                            display: true,
                            position: 'left',
                            title: {
                                display: true,
                                text: 'Quiz Attempts'
                            },
                            grid: {
                                color: '#f8f9fa'
                            }
                        },
                        y1: {
                            type: 'linear',
                            display: true,
                            position: 'right',
                            title: {
                                display: true,
                                text: 'Average Score (%)'
                            },
                            grid: {
                                drawOnChartArea: false,
                            },
                            max: 100
                        },
                        x: {
                            grid: {
                                color: '#f8f9fa'
                            }
                        }
                    }
                }
            });
        },

        getBestScore() {
            if (!this.userStats.recent_attempts || this.userStats.recent_attempts.length === 0) {
                return '0%';
            }
            const bestScore = Math.max(...this.userStats.recent_attempts.map(attempt => attempt.percentage));
            return bestScore + '%';
        },

        getUniqueSubjects() {
            if (!this.userStats.subject_wise_performance) {
                return 0;
            }
            return this.userStats.subject_wise_performance.length;
        },

        getPerformanceClass(score) {
            if (score >= 80) return 'bg-success';
            if (score >= 60) return 'bg-warning';
            return 'bg-danger';
        },

        getScoreColor(percentage) {
            if (percentage >= 80) return 'success';
            if (percentage >= 60) return 'warning';
            return 'danger';
        }
    }
};