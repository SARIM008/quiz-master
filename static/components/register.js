export default {
    template: `
    <div class="container mt-5">
        <div class="row justify-content-center">
            <div class="col-md-6">
                <div class="card">
                    <div class="card-header text-center">
                        <h4>Register</h4>
                    </div>
                    <div class="card-body">
                        <form @submit.prevent="registerUser">
                            <div class="mb-3">
                                <label for="full_name" class="form-label">Full Name</label>
                                <input type="text" class="form-control" id="full_name" v-model="formData.full_name" required>
                            </div>
                            <div class="mb-3">
                                <label for="email" class="form-label">Email</label>
                                <input type="email" class="form-control" id="email" v-model="formData.email" required>
                            </div>
                            <div class="mb-3">
                                <label for="qualification" class="form-label">Qualification</label>
                                <input type="text" class="form-control" id="qualification" v-model="formData.qualification" required>
                            </div>
                            <div class="mb-3">
                                <label for="dob" class="form-label">Date of Birth</label>
                                <input type="date" class="form-control" id="dob" v-model="formData.dob" required>
                            </div>
                            <div class="mb-3">
                                <label for="password" class="form-label">Password</label>
                                <input type="password" class="form-control" id="password" v-model="formData.password" required>
                            </div>
                            <div class="mb-3">
                                <label for="confirmPassword" class="form-label">Confirm Password</label>
                                <input type="password" class="form-control" id="confirmPassword" v-model="formData.confirmPassword" required>
                            </div>
                            <button type="submit" class="btn btn-primary w-100">Register</button>
                        </form>
                    </div>
                    <div class="card-footer text-center">
                        <p>Already have an account? <a href="#/login">Login here</a></p>
                    </div>
                </div>
            </div>
        </div>
    </div>
    `,
    data: function() {
        return {
            formData: {
                full_name: "",  
                email: "",
                qualification: "",
                dob: "",
                password: "",
                confirmPassword: ""
            }
        };
    },
    methods: {
        registerUser: function() {
            if (this.formData.password !== this.formData.confirmPassword) {
                alert("Passwords do not match!");
                return;
            }

            fetch('/api/register', {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    full_name: this.formData.full_name, 
                    email: this.formData.email,
                    qualification: this.formData.qualification,
                    dob: this.formData.dob,
                    password: this.formData.password
                })
            })
            .then(response => response.json())
            .then(data => {
                console.log(data);
                if (data.error) {
                    alert("Registration Failed: " + data.error);
                } else {
                    alert("Registration Successful!");
                    window.location.href = "#/login";  
                }
            })
            .catch(error => {
                console.error("Error:", error);
                alert("An error occurred. Please try again.");
            });
        }
    }
}
