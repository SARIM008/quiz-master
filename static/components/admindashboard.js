import AddSubjectForm from "./AddSubjectForm.js";
import AddChapterForm from "./AddChapterForm.js";
import EditChapterForm from "./EditChapterForm.js";

export default {
  components: {
    AddSubjectForm,
    AddChapterForm,
    EditChapterForm
  },
  template: `
  <div class="container mt-4">
    <!-- Navbar Merged -->
    <nav class="navbar navbar-expand-lg navbar-dark bg-dark mb-4">
      <div class="container-fluid">
        <span class="navbar-brand">Welcome, Admin</span>
        <form class="d-flex ms-auto me-3" @submit.prevent="search">
          <input class="form-control me-2" type="search" v-model="searchQuery" placeholder="Search subjects, users..." aria-label="Search">
          <button class="btn btn-outline-light" type="submit">Search</button>
        </form>
        <div class="navbar-nav d-flex flex-row">
          <router-link class="nav-link text-white me-3" to="/Summary">Summary</router-link>
          <router-link class="nav-link text-white me-3" to="/Quizadmin">Quiz</router-link>
          <router-link class="nav-link text-white me-3" to="/admindashboard">Home</router-link>
          <a class="nav-link text-white" href="#" @click.prevent="logout">Logout</a>
        </div>
      </div>
    </nav>

    
    <h2>Admin Dashboard</h2>
    
    <!-- Toggle Buttons -->
    <div class="d-flex justify-content-between align-items-center mb-4">
      <div class="btn-group" role="group">
        <button 
          type="button" 
          class="btn" 
          :class="activeView === 'subjects' ? 'btn-primary' : 'btn-outline-primary'"
          @click="setActiveView('subjects')"
        >
          Subjects Management
        </button>
        <button 
          type="button" 
          class="btn" 
          :class="activeView === 'users' ? 'btn-primary' : 'btn-outline-primary'"
          @click="setActiveView('users')"
        >
          Users Management
        </button>
        <button 
          type="button" 
          class="btn" 
          :class="activeView === 'csv' ? 'btn-primary' : 'btn-outline-primary'"
          @click="setActiveView('csv')"
        >
          CSV Management
        </button>
      </div>
    </div>

    <!-- CSV Management View -->
    <div v-if="activeView === 'csv'">
      <div class="row justify-content-center">
        <div class="col-md-6">
          <div class="card shadow">
            <div class="card-header bg-success text-white text-center">
              <h4 class="mb-0">📊 CSV Export</h4>
            </div>
            <div class="card-body text-center">
              <p class="card-text mb-4">
                Export all user quiz performance data as a CSV file. 
                This includes scores, rankings, and detailed analytics.
              </p>
              
              <div v-if="csvExport.isProcessing" class="mb-4">
                <div class="spinner-border text-primary mb-3" role="status" style="width: 3rem; height: 3rem;">
                  <span class="visually-hidden">Loading...</span>
                </div>
                <div class="progress mb-3">
                  <div class="progress-bar progress-bar-striped progress-bar-animated" 
                       role="progressbar" style="width: 100%"></div>
                </div>
                <p class="text-muted h5">{{ csvExport.statusMessage }}</p>
                <small class="text-info">Please wait, this may take a few moments...</small>
              </div>
              
              <button 
                class="btn btn-success btn-lg px-5 py-3"
                @click="exportAndDownloadCsv"
                :disabled="csvExport.isProcessing"
              >
                <span v-if="csvExport.isProcessing">
                  <span class="spinner-border spinner-border-sm me-2" role="status"></span>
                  Processing...
                </span>
                <span v-else>
                  📥 Export & Download CSV
                </span>
              </button>
              
              <div v-if="csvExport.lastMessage" class="mt-4">
                <div v-if="csvExport.lastMessage.type === 'success'" class="alert alert-success">
                  <strong>{{ csvExport.lastMessage.text }}</strong>
                </div>
                <div v-else-if="csvExport.lastMessage.type === 'error'" class="alert alert-danger">
                  <strong>{{ csvExport.lastMessage.text }}</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Subjects View -->
    <div v-if="activeView === 'subjects'">
      <button class="btn btn-primary my-3" @click="openAddSubjectModal">Add Subject</button>

      <!-- Subjects Block View -->
      <div class="row">
        <div v-for="subject in filteredSubjects" :key="subject.subject_id" class="col-md-4 mb-4">
          <div class="card h-100 shadow">
            <!-- Subject Header -->
            <div class="card-header bg-primary text-white d-flex justify-content-between align-items-center">
              <h5 class="mb-0" style="white-space: normal; word-break: break-word;">{{ subject.subject_name }}</h5>
              <div class="d-flex">
                <button 
                  class="btn btn-sm me-2"
                  :class="subject.is_flagged ? 'btn-warning' : 'btn-outline-warning'"
                  @click="toggleSubjectFlag(subject.subject_id, subject.is_flagged)"
                  :title="subject.is_flagged ? 'Unflag Subject' : 'Flag Subject'"
                >
                  <span v-if="subject.is_flagged"> 🚩 Unflag</span>
                  <span v-else>🏳️ Flag</span>
                </button>
                <button class="btn btn-sm btn-light me-2" @click="openEditSubject(subject)">Edit</button>
                <button class="btn btn-sm btn-danger" @click="deleteSubject(subject.subject_id)">Delete</button>
              </div>
            </div>

            <!-- Chapter List -->
            <div class="card-body">
              <ul class="list-group list-group-flush">
                <li
                  v-for="chapter in subject.chapters"
                  :key="chapter.id"
                  class="list-group-item d-flex justify-content-between align-items-start"
                >
                  <div class="flex-grow-1 me-2">
                    <div class="fw-medium" style="word-break: break-word;">
                      {{ chapter.name }}
                    </div>
                    <small class="text-muted">({{ chapter.question_count }} Questions)</small>
                  </div>
                  <div class="btn-group btn-group-sm flex-shrink-0">
                    <button
                      class="btn btn-outline-warning px-2"
                      @click="openEditChapter(subject.subject_id, chapter)"
                    >
                      ✏️
                    </button>
                    <button
                      class="btn btn-outline-danger px-2"
                      @click="deleteChapter(chapter.id)"
                    >
                      🗑️
                    </button>
                  </div>
                </li>
                <li class="list-group-item text-center">
                  <button class="btn btn-sm btn-success px-3" @click="openAddChapterModal(subject.subject_id)">
                    + Add Chapter
                  </button>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Users View -->
    <div v-if="activeView === 'users'">
      <div class="d-flex justify-content-between align-items-center mb-4">
        <h4>Users Management</h4>
        <div class="d-flex gap-2">
          <span class="badge bg-secondary">Total: {{ totalNonAdminUsers }}</span>
          <span class="badge bg-warning">Flagged: {{ flaggedUsersCount }}</span>
          <span class="badge bg-success">Active: {{ activeUsersCount }}</span>
        </div>
      </div>

      <!-- Users Cards -->
      <div class="row">
        <div v-for="user in filteredUsers" :key="user.id" class="col-md-4 mb-4">
          <div class="card h-100 shadow">
            <!-- User Header -->
            <div class="card-header d-flex justify-content-between align-items-center"
                 :class="user.is_flagged ? 'bg-warning text-dark' : 'bg-info text-white'">
              <div>
                <h5 class="mb-0" style="white-space: normal; word-break: break-word;">
                  {{ user.full_name }}
                </h5>
                <small class="opacity-75">{{ user.email }}</small>
              </div>
              <div class="d-flex">
                <button 
                  class="btn btn-sm me-2"
                  :class="user.is_flagged ? 'btn-outline-dark' : 'btn-outline-light'"
                  @click="toggleUserFlag(user.id, user.is_flagged)"
                  :title="user.is_flagged ? 'Unflag User' : 'Flag User'"
                >
                  <span v-if="user.is_flagged">🚩</span>
                  <span v-else>🏳️</span>
                </button>
                <button class="btn btn-sm btn-light me-2" @click="openEditUser(user)">✏️</button>
                <button class="btn btn-sm btn-danger" @click="deleteUser(user.id)">🗑️</button>
              </div>
            </div>

            <!-- User Details -->
            <div class="card-body">
              <div class="row g-2">
                <div class="col-12">
                  <strong>Qualification:</strong> {{ user.qualification || 'Not specified' }}
                </div>
                <div class="col-12">
                  <strong>Date of Birth:</strong> {{ formatDate(user.dob) }}
                </div>
                <div class="col-12">
                  <span class="badge" :class="user.is_flagged ? 'bg-danger' : 'bg-success'">
                    {{ user.is_flagged ? 'Flagged' : 'Active' }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- No users message -->
      <div v-if="filteredUsers.length === 0" class="text-center mt-5">
        <div class="alert alert-info">
          <h5>No users found</h5>
          <p class="mb-0">{{ searchQuery ? 'Try adjusting your search terms.' : 'No registered users yet.' }}</p>
        </div>
      </div>
    </div>

    <!-- All existing modals remain the same -->
    <!-- Edit Subject Modal -->
    <div class="modal fade" id="editSubjectModal" tabindex="-1">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Edit Subject</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body">
            <div class="mb-3">
              <label for="editSubjectName" class="form-label">Subject Name</label>
              <input 
                v-model="editSubjectData.name" 
                type="text" 
                class="form-control" 
                id="editSubjectName"
                placeholder="Enter subject name" 
              />
            </div>
            <div class="mb-3">
              <label for="editSubjectDescription" class="form-label">Subject Description</label>
              <textarea 
                v-model="editSubjectData.description" 
                class="form-control" 
                id="editSubjectDescription"
                rows="3"
                placeholder="Enter subject description"
              ></textarea>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-primary" @click="saveSubject">Save</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Edit User Modal -->
    <div class="modal fade" id="editUserModal" tabindex="-1">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Edit User</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body">
            <div class="mb-3">
              <label for="editUserName" class="form-label">Full Name</label>
              <input 
                v-model="editUserData.full_name" 
                type="text" 
                class="form-control" 
                id="editUserName"
                placeholder="Enter full name" 
              />
            </div>
            <div class="mb-3">
              <label for="editUserQualification" class="form-label">Qualification</label>
              <input 
                v-model="editUserData.qualification" 
                type="text" 
                class="form-control" 
                id="editUserQualification"
                placeholder="Enter qualification" 
              />
            </div>
            <div class="mb-3">
              <label for="editUserDob" class="form-label">Date of Birth</label>
              <input 
                v-model="editUserData.dob" 
                type="date" 
                class="form-control" 
                id="editUserDob"
              />
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-primary" @click="saveUser">Save</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Edit Chapter Modal -->
    <div class="modal fade" id="editChapterModal" tabindex="-1">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Edit Chapter</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body">
            <div class="mb-3">
              <label for="editChapterName" class="form-label">Chapter Name</label>
              <input 
                v-model="editChapterData.name" 
                type="text" 
                class="form-control" 
                id="editChapterName"
                placeholder="Enter chapter name" 
              />
            </div>
            <div class="mb-3">
              <label for="editChapterDescription" class="form-label">Chapter Description</label>
              <textarea 
                v-model="editChapterData.description" 
                class="form-control" 
                id="editChapterDescription"
                rows="3"
                placeholder="Enter chapter description"
              ></textarea>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-primary" @click="saveChapter">Save</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Add Subject Modal -->
    <div class="modal fade" id="addSubjectModal" tabindex="-1">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Add New Subject</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body">
            <div class="mb-3">
              <label for="subjectName" class="form-label">Subject Name</label>
              <input 
                v-model="newSubjectData.name" 
                type="text" 
                class="form-control" 
                id="subjectName"
                placeholder="Enter subject name" 
                required
              />
            </div>
            <div class="mb-3">
              <label for="subjectDescription" class="form-label">Subject Description</label>
              <textarea 
                v-model="newSubjectData.description" 
                class="form-control" 
                id="subjectDescription"
                rows="3"
                placeholder="Enter subject description"
              ></textarea>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
            <button type="button" class="btn btn-primary" @click="addSubject">Save Subject</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Add Chapter Modal -->
    <div class="modal fade" id="addChapterModal" tabindex="-1">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Add New Chapter</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body">
            <div class="mb-3">
              <label for="chapterName" class="form-label">Chapter Name</label>
              <input 
                v-model="newChapterData.name" 
                type="text" 
                class="form-control" 
                id="chapterName"
                placeholder="Enter chapter name" 
                required
              />
            </div>
            <div class="mb-3">
              <label for="chapterDescription" class="form-label">Chapter Description</label>
              <textarea 
                v-model="newChapterData.description" 
                class="form-control" 
                id="chapterDescription"
                rows="3"
                placeholder="Enter chapter description"
              ></textarea>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
            <button type="button" class="btn btn-primary" @click="addChapter">Save Chapter</button>
          </div>
        </div>
      </div>
    </div>
  </div>
  `,
  
  data() {
    return {
      activeView: 'subjects',
      subjects: [],
      users: [],
      editSubjectData: {
        subject_id: null,
        name: '',
        description: ''
      },
      editChapterData: {
        name: '',
        description: ''
      },
      editUserData: {
        id: null,
        full_name: '',
        qualification: '',
        dob: ''
      },
      newSubjectData: {
        name: '',
        description: ''
      },
      newChapterData: {
        name: '',
        description: '',
        subject_id: null
      },
      selectedSubjectId: null,
      selectedChapterId: null,
      searchQuery: '',
      csvExport: {
        isProcessing: false,
        statusMessage: '',
        lastMessage: null
      }
    };
  },

  computed: {
    totalNonAdminUsers() {
      return this.users.length > 0 ? this.users.length - 1 : 0;
    },
    
    flaggedUsersCount() {
      return this.users.filter(user => !this.isAdmin(user) && user.is_flagged).length;
    },
    
    activeUsersCount() {
      return this.users.filter(user => !this.isAdmin(user) && !user.is_flagged).length;
    },
    
    filteredSubjects() {
      if (!this.searchQuery.trim()) return this.subjects;
      
      const query = this.searchQuery.toLowerCase();
      return this.subjects.filter(subject => 
        subject.subject_name.toLowerCase().includes(query) ||
        (subject.description && subject.description.toLowerCase().includes(query)) ||
        subject.chapters.some(chapter => 
          chapter.name.toLowerCase().includes(query)
        )
      );
    },
    
    filteredUsers() {
      if (!this.searchQuery.trim()) {
        return this.users.filter(user => !this.isAdmin(user));
      }

      const query = this.searchQuery.toLowerCase();
      return this.users.filter(user =>
        !this.isAdmin(user) && (
          user.full_name.toLowerCase().includes(query) ||
          user.email.toLowerCase().includes(query) ||
          (user.qualification && user.qualification.toLowerCase().includes(query))
        )
      );
    },
  },

  mounted() {
    this.fetchDashboard();
    this.fetchUsers();
  },

  methods: {
    isAdmin(user){
      return user.roles.includes('admin');  
    },
    
    setActiveView(view) {
      this.activeView = view;
      this.searchQuery = '';
    },

    
    async exportAndDownloadCsv() {
      if (!this.checkAuth()) return;
      
      this.csvExport.isProcessing = true;
      this.csvExport.statusMessage = 'Starting CSV export...';
      this.csvExport.lastMessage = null;
      
      try {
       
        const response = await fetch('/api/admin/export-csv', {
          method: 'POST',
          headers: {
            'Authentication-Token': localStorage.getItem('auth_token'),
            'Content-Type': 'application/json'
          }
        });
        
        if (response.status === 401) {
          this.handleAuthError();
          return;
        }
        
        if (!response.ok) {
          throw new Error(`Failed to start export: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        if (data.status !== 'success') {
          throw new Error(data.message || 'Failed to start export');
        }
        
        const jobId = data.job_id;
        this.csvExport.statusMessage = 'Processing data...';
        
        
        await this.pollAndDownload(jobId);
        
      } catch (error) {
        console.error('CSV Export Error:', error);
        this.csvExport.isProcessing = false;
        this.csvExport.lastMessage = {
          type: 'error',
          text: `Export failed: ${error.message}`
        };
      }
    },
    
    async pollAndDownload(jobId) {
      const maxAttempts = 60; 
      let attempts = 0;
      
      const poll = async () => {
        attempts++;
        
        try {
          const response = await fetch(`/api/admin/export-status/${jobId}`, {
            headers: {
              'Authentication-Token': localStorage.getItem('auth_token')
            }
          });
          
          if (response.status === 401) {
            this.handleAuthError();
            return;
          }
          
          if (!response.ok) {
            throw new Error(`Failed to check status: ${response.statusText}`);
          }
          
          const data = await response.json();
          
          if (data.status === 'completed') {
            this.csvExport.statusMessage = 'Download starting...';
            
           
            const filename = data.result.filename;
            await this.downloadFile(filename);
            
            this.csvExport.isProcessing = false;
            this.csvExport.lastMessage = {
              type: 'success',
              text: 'CSV exported and downloaded successfully!'
            };
            
          } else if (data.status === 'failed') {
            throw new Error(data.error || 'Export job failed');
            
          } else if (data.status === 'pending') {
            this.csvExport.statusMessage = data.progress || 'Processing...';
            
            if (attempts < maxAttempts) {
              setTimeout(poll, 2000); 
            } else {
              throw new Error('Export timed out');
            }
          }
          
        } catch (error) {
          this.csvExport.isProcessing = false;
          this.csvExport.lastMessage = {
            type: 'error',
            text: error.message
          };
        }
      };
      
      
      setTimeout(poll, 2000);
    },
    
    async downloadFile(filename) {
      const response = await fetch(`/api/admin/download-csv/${filename}`, {
        headers: {
          'Authentication-Token': localStorage.getItem('auth_token')
        }
      });
      
      if (response.status === 401) {
        this.handleAuthError();
        return;
      }
      
      if (response.status === 404) {
        throw new Error('File not found or has expired');
      }
      
      if (!response.ok) {
        throw new Error(`Download failed: ${response.statusText}`);
      }
      
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    },
    
    handleAuthError() {
      console.error('Authentication failed - redirecting to login');
      localStorage.removeItem('auth_token');
      this.$router.push('/login');
    },

    
    checkAuth() {
      const token = localStorage.getItem('auth_token');
      console.log('Current auth token:', token);
      if (!token) {
        console.error('No auth token found');
        alert('No authentication token found. Please login again.');
        this.$router.push('/login');
        return false;
      }
      return true;
    },

    fetchDashboard() {
      if (!this.checkAuth()) return;
      
      const token = localStorage.getItem('auth_token');
      console.log('Fetching dashboard with token:', token);
      
      fetch('/api/admindashboard', {
        headers: {
          'Authentication-Token': token,
        },
      })
      .then(async res => {
        console.log('Dashboard response status:', res.status);
        if (res.status === 401) {
          console.error('Authentication failed - token might be invalid');
          alert('Authentication failed. Please login again.');
          localStorage.removeItem('auth_token');
          this.$router.push('/login');
          return;
        }
        if (!res.ok) {
          const text = await res.text();
          console.error('Dashboard fetch error:', text);
          throw new Error(`Unexpected response: ${text}`);
        }
        return res.json();
      })
      .then(data => {
        if (data) {
          console.log('Dashboard data:', data);
          this.subjects = data.subjects || [];
        }
      })
      .catch(err => {
        console.error("Admin dashboard fetch failed:", err.message);
      });
    },

    fetchUsers() {
      if (!this.checkAuth()) return;
      
      const token = localStorage.getItem('auth_token');
      
      fetch('/api/users', {
        headers: {
          'Authentication-Token': token,
        },
      })
      .then(async res => {
        if (res.status === 401) {
          console.error('Authentication failed - redirecting to login');
          localStorage.removeItem('auth_token');
          this.$router.push('/login');
          return;
        }
        if (!res.ok) {
          const text = await res.text();
          throw new Error(`Failed to fetch users: ${text}`);
        }
        return res.json();
      })
      .then(data => {
        if (data) {
          console.log('Users data:', data);
          this.users = data;
        }
      })
      .catch(err => {
        console.error("Fetch users failed:", err.message);
      });
    },

    
    openEditUser(user) {
      this.editUserData = {
        id: user.id,
        full_name: user.full_name,
        qualification: user.qualification || '',
        dob: user.dob
      };
      new bootstrap.Modal(document.getElementById('editUserModal')).show();
    },

    saveUser() {
      if (!this.editUserData.full_name.trim()) {
        alert('Please enter a full name');
        return;
      }

      const payload = {
        full_name: this.editUserData.full_name,
        qualification: this.editUserData.qualification,
        dob: this.editUserData.dob
      };

      fetch(`/api/users/${this.editUserData.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authentication-Token': localStorage.getItem('auth_token'),
        },
        body: JSON.stringify(payload),
      })
      .then(async res => {
        if (res.status === 401) {
          console.error('Authentication failed - redirecting to login');
          localStorage.removeItem('auth_token');
          this.$router.push('/login');
          return;
        }
        if (!res.ok) {
          const text = await res.text();
          throw new Error(`Failed to update user: ${text}`);
        }
        return res.json();
      })
      .then((data) => {
        if (data) {
          this.fetchUsers();
          bootstrap.Modal.getInstance(document.getElementById('editUserModal')).hide();
          alert('User updated successfully!');
        }
      })
      .catch(err => {
        console.error("Update user failed:", err.message);
        alert('Failed to update user. Please try again.');
      });
    },

    deleteUser(userId) {
      if (!confirm("Are you sure you want to delete this user? This action cannot be undone.")) return;
      
      fetch(`/api/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authentication-Token': localStorage.getItem('auth_token'),
        },
      })
      .then(async res => {
        if (res.status === 401) {
          console.error('Authentication failed - redirecting to login');
          localStorage.removeItem('auth_token');
          this.$router.push('/login');
          return;
        }
        if (!res.ok) {
          const text = await res.text();
          throw new Error(`Failed to delete user: ${text}`);
        }
        return res.json();
      })
      .then(() => {
        this.fetchUsers();
        alert('User deleted successfully!');
      })
      .catch(err => {
        console.error("Delete user failed:", err.message);
        alert('Failed to delete user. Please try again.');
      });
    },

    toggleUserFlag(userId, currentFlagStatus) {
      const action = currentFlagStatus ? 'unflag' : 'flag';
      const confirmMessage = currentFlagStatus ? 
        'Are you sure you want to unflag this user?' : 
        'Are you sure you want to flag this user?';
      
      if (!confirm(confirmMessage)) return;

      const payload = { is_flagged: !currentFlagStatus };

      fetch(`/api/users/${userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authentication-Token': localStorage.getItem('auth_token'),
        },
        body: JSON.stringify(payload),
      })
      .then(async res => {
        if (res.status === 401) {
          console.error('Authentication failed - redirecting to login');
          localStorage.removeItem('auth_token');
          this.$router.push('/login');
          return null;
        }
        if (!res.ok) {
          const text = await res.text();
          throw new Error(`Failed to ${action} user: ${text}`);
        }
        return res.json();
      })
      .then((data) => {
        if (data) {
          
          const user = this.users.find(u => u.id === userId);
          if (user) {
            user.is_flagged = !currentFlagStatus;
          }
          
          this.$forceUpdate();
          alert(`User ${action}ged successfully!`);
        }
      })
      .catch(err => {
        console.error(`${action} user failed:`, err.message);
        alert(`Failed to ${action} user. Please try again.`);
      });
    },

    
    formatDate(dateString) {
      if (!dateString) return 'Not specified';
      return new Date(dateString).toLocaleDateString();
    },

    
    openEditSubject(subject) {
      this.editSubjectData = { 
        subject_id: subject.subject_id,
        name: subject.subject_name,
        description: subject.description || ''
      };
      new bootstrap.Modal(document.getElementById('editSubjectModal')).show();
    },

    saveSubject() {
      if (!this.editSubjectData.name.trim()) {
        alert('Please enter a subject name');
        return;
      }

      const payload = {
        name: this.editSubjectData.name,
        description: this.editSubjectData.description
      };

      fetch(`/api/subjects/${this.editSubjectData.subject_id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authentication-Token': localStorage.getItem('auth_token'),
        },
        body: JSON.stringify(payload),
      })
      .then(async res => {
        if (res.status === 401) {
          console.error('Authentication failed - redirecting to login');
          localStorage.removeItem('auth_token');
          this.$router.push('/login');
          return;
        }
        if (!res.ok) {
          const text = await res.text();
          throw new Error(`Failed to update subject: ${text}`);
        }
        return res.json();
      })
      .then((data) => {
        if (data) {
          this.fetchDashboard();
          bootstrap.Modal.getInstance(document.getElementById('editSubjectModal')).hide();
          alert('Subject updated successfully!');
        }
      })
      .catch(err => {
        console.error("Update subject failed:", err.message);
        alert('Failed to update subject. Please try again.');
      });
    },

    deleteSubject(subjectId) {
      if (!confirm("Are you sure you want to delete this subject?")) return;
      fetch(`/api/subjects/${subjectId}`, {
        method: 'DELETE',
        headers: {
          'Authentication-Token': localStorage.getItem('auth_token'),
        },
      })
      .then(() => this.fetchDashboard());
    },

    toggleSubjectFlag(subjectId, currentFlagStatus) {
      console.log('=== FLAG TOGGLE DEBUG ===');
      console.log('Subject ID:', subjectId);
      console.log('Current flag status:', currentFlagStatus);
      console.log('Will set to:', !currentFlagStatus);

      const action = currentFlagStatus ? 'unflag' : 'flag';
      const confirmMessage = currentFlagStatus ? 
        'Are you sure you want to unflag this subject?' : 
        'Are you sure you want to flag this subject?';
      
      if (!confirm(confirmMessage)) {
        console.log('User cancelled the action');
        return;
      }

      const payload = { is_flagged: !currentFlagStatus };
      console.log('Sending payload:', payload);

      fetch(`/api/subjects/${subjectId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authentication-Token': localStorage.getItem('auth_token'),
        },
        body: JSON.stringify(payload),
      })
      .then(async res => {
        console.log('Response status:', res.status);
        if (res.status === 401) {
          console.error('Authentication failed - redirecting to login');
          localStorage.removeItem('auth_token');
          this.$router.push('/login');
          return null;
        }
        if (!res.ok) {
          const text = await res.text();
          console.error('API Error:', text);
          throw new Error(`Failed to ${action} subject: ${text}`);
        }
        const data = await res.json();
        console.log('API Response:', data);
        return data;
      })
      .then((data) => {
        if (data) {
          console.log('Success! Updating local state...');
          
         
          const subject = this.subjects.find(s => s.subject_id === subjectId);
          if (subject) {
            const oldStatus = subject.is_flagged;
            subject.is_flagged = !currentFlagStatus;
            console.log(`Subject "${subject.subject_name}" flag status: ${oldStatus} → ${subject.is_flagged}`);
          } else {
            console.error('Subject not found in local state!');
          }
          
         
          this.$forceUpdate();
          
          const message = data.message || `Subject ${action}ged successfully!`;
          alert(message);
          
          
          setTimeout(() => {
            console.log('Refreshing dashboard data...');
            this.fetchDashboard();
          }, 500);
        }
      })
      .catch(err => {
        console.error(`${action} subject failed:`, err.message);
        alert(`Failed to ${action} subject. Please try again.`);
      });
    },

    openEditChapter(subjectId, chapter) {
      this.selectedSubjectId = subjectId;
      this.selectedChapterId = chapter.id;
      this.editChapterData = { 
        name: chapter.name,
        description: chapter.description || ''
      };
      new bootstrap.Modal(document.getElementById('editChapterModal')).show();
    },

    saveChapter() {
      if (!this.editChapterData.name.trim()) {
        alert('Please enter a chapter name');
        return;
      }

      const token = localStorage.getItem('auth_token');
      console.log('=== CHAPTER UPDATE DEBUG ===');
      console.log('Token:', token);
      console.log('Chapter ID:', this.selectedChapterId);
      console.log('Subject ID:', this.selectedSubjectId);

      const payload = {
        name: this.editChapterData.name,
        description: this.editChapterData.description,
        subject_id: this.selectedSubjectId  
      };

      console.log('Payload:', payload);

      fetch(`/api/chapters/${this.selectedChapterId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authentication-Token': token,
        },
        body: JSON.stringify(payload),
      })
      .then(async res => {
        console.log('Response status:', res.status);
        
        if (res.status === 401) {
          const errorText = await res.text();
          console.error('401 Error details:', errorText);
          alert(`Authentication failed: ${errorText}`);
          localStorage.removeItem('auth_token');
          this.$router.push('/login');
          return;
        }
        if (!res.ok) {
          const text = await res.text();
          console.error('Error response:', text);
          throw new Error(`Failed to update chapter: ${text}`);
        }
        return res.json();
      })
      .then((data) => {
        console.log('Success response:', data);
        if (data) {
          this.fetchDashboard();
          bootstrap.Modal.getInstance(document.getElementById('editChapterModal')).hide();
          alert('Chapter updated successfully!');
        }
      })
      .catch(err => {
        console.error("Update chapter failed:", err.message);
        alert('Failed to update chapter. Please try again.');
      });
    },

    deleteChapter(chapterId) {
      if (!confirm("Delete this chapter?")) return;
      fetch(`/api/chapters/${chapterId}`, {
        method: 'DELETE',
        headers: {
          'Authentication-Token': localStorage.getItem('auth_token'),
        },
      })
      .then(() => this.fetchDashboard());
    },

    openAddSubject() {
      this.$router.push('/AddSubjectForm');
    },

    openAddChapter(subjectId) {
      this.$router.push({ path: '/AddChapterForm', query: { subject_id: subjectId } });
    },

    openAddSubjectModal() {
      this.newSubjectData.name = '';
      this.newSubjectData.description = '';
      new bootstrap.Modal(document.getElementById('addSubjectModal')).show();
    },

    openAddChapterModal(subjectId) {
      this.newChapterData.name = '';
      this.newChapterData.description = '';
      this.newChapterData.subject_id = subjectId;
      new bootstrap.Modal(document.getElementById('addChapterModal')).show();
    },

    addSubject() {
      if (!this.checkAuth()) return;
      
      if (!this.newSubjectData.name.trim()) {
        alert('Please enter a subject name');
        return;
      }

      const payload = {
        name: this.newSubjectData.name,
        description: this.newSubjectData.description
      };

      fetch('/api/subjects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authentication-Token': localStorage.getItem('auth_token'),
        },
        body: JSON.stringify(payload),
      })
      .then(async res => {
        if (res.status === 401) {
          console.error('Authentication failed - redirecting to login');
          localStorage.removeItem('auth_token');
          this.$router.push('/login');
          return;
        }
        if (!res.ok) {
          const text = await res.text();
          throw new Error(`Failed to add subject: ${text}`);
        }
        return res.json();
      })
      .then((data) => {
        if (data) {
          this.fetchDashboard();
          bootstrap.Modal.getInstance(document.getElementById('addSubjectModal')).hide();
          this.newSubjectData.name = '';
          this.newSubjectData.description = '';
          alert('Subject added successfully!');
        }
      })
      .catch(err => {
        console.error("Add subject failed:", err.message);
        alert('Failed to add subject. Please try again.');
      });
    },

    addChapter() {
      if (!this.checkAuth()) return;
      
      if (!this.newChapterData.name.trim()) {
        alert('Please enter a chapter name');
        return;
      }

      const payload = {
        name: this.newChapterData.name,
        description: this.newChapterData.description,
        subject_id: this.newChapterData.subject_id
      };

      fetch('/api/chapters', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authentication-Token': localStorage.getItem('auth_token'),
        },
        body: JSON.stringify(payload),
      })
      .then(async res => {
        if (res.status === 401) {
          console.error('Authentication failed - redirecting to login');
          localStorage.removeItem('auth_token');
          this.$router.push('/login');
          return;
        }
        if (!res.ok) {
          const text = await res.text();
          throw new Error(`Failed to add chapter: ${text}`);
        }
        return res.json();
      })
      .then((data) => {
        if (data) {
          this.fetchDashboard();
          bootstrap.Modal.getInstance(document.getElementById('addChapterModal')).hide();
          this.newChapterData.name = '';
          this.newChapterData.description = '';
          this.newChapterData.subject_id = null;
          alert('Chapter added successfully!');
        }
      })
      .catch(err => {
        console.error("Add chapter failed:", err.message);
        alert('Failed to add chapter. Please try again.');
      });
    },

    logout() {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
      this.$router.push('/login');
    },

    search() {
      console.log(`Searching for: ${this.searchQuery}`);
    }
  }
};