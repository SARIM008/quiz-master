export default {
    template: `
    <div class="container mt-5">
        <div class="row justify-content-center">
            <div class="col-md-4">
                <div class="card">
                    <div class="card-header text-center">
                        <h4>Login</h4>
                    </div>
                    <div class="card-body">
                        <!-- Show error message if login fails -->
                        <div v-if="message" class="alert alert-danger" role="alert">
                            {{ message }}
                        </div>
                        
                        <form @submit.prevent="loginUser">
                            <div class="mb-3">
                                <label for="email" class="form-label">Email</label>
                                <input type="email" class="form-control" id="email" v-model="formData.email" required>
                            </div>
                            <div class="mb-3">
                                <label for="password" class="form-label">Password</label>
                                <input type="password" class="form-control" id="password" v-model="formData.password" required>
                            </div>
                            <button type="submit" class="btn btn-primary w-100" :disabled="loading">
                                {{ loading ? 'Logging in...' : 'Login' }}
                            </button>
                        </form>
                    </div>
                    <div class="card-footer text-center">
                        <p>Don't have an account? <a href="#/register">Register</a></p>
                    </div>
                </div>
            </div>
        </div>
    </div>
    `,
    data: function() {
        return {
            formData: {
                email: "",
                password: ""
            },
            message: "",
            loading: false  
        }
    },
    methods: {
        loginUser: function() {
           
            this.loading = true;
            this.message = ""; 
            
            fetch('/api/login', {
                method: 'POST',
                headers: {
                    "Content-Type": 'application/json'
                },
                body: JSON.stringify(this.formData)
            })
            .then(response => response.json())
            .then(data => {
                console.log("Login response:", data);
                
               
                if (data["auth-token"]) {
                    
                    localStorage.setItem("auth_token", data["auth-token"]);
                    localStorage.setItem("user_id", data.id);
                    localStorage.setItem("username", data.username);
                    localStorage.setItem("user_email", data.email);
                    
                   
                    localStorage.setItem("user", JSON.stringify({
                        id: data.id,
                        username: data.username,
                        email: data.email,
                        full_name: data.username,
                        qualification: data.qualification,
                        dob: data.dob,
                        roles: data.roles
                    }));
                    
                    this.$emit('login');
                    
                    
                    if (data.roles && data.roles.includes('admin')) {
                        this.$router.push('/admindashboard');
                    } else {
                        this.$router.push('/UserDashboard');
                    }
                } else {
                   
                    this.message = data.error || data.message || "Login failed. Please try again.";
                }
            })
            .catch(error => {
                console.error('Login error:', error);
                this.message = "Network error. Please try again.";
            })
            .finally(() => {
               
                this.loading = false;
            });
        }
    }
};