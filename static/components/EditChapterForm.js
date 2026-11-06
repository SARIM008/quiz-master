export default {
  props: ["chapter"],
  data() {
    return {
      name: this.chapter.name,
      description: this.chapter.description,
      saving: false
    };
  },
  methods: {
    async updateChapter() {
      this.saving = true;
      try {
        const response = await fetch(`/api/chapters/${this.chapter.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "Authentication-Token": localStorage.getItem("auth_token")
          },
          body: JSON.stringify({
            name: this.name,
            description: this.description,
            subject_id: this.chapter.subject_id 
          })
        });

        if (!response.ok) throw new Error("Update failed");

        this.$emit("chapter-updated");
      } catch (err) {
        alert("Error updating chapter");
        console.error(err);
      } finally {
        this.saving = false;
      }
    }
  },
  template: `
    <div class="modal fade show d-block" tabindex="-1" style="background: rgba(0,0,0,0.5);">
      <div class="modal-dialog modal-sm">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Edit Chapter</h5>
            <button type="button" class="btn-close" @click="$emit('close')"></button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label>Name</label>
              <input v-model="name" class="form-control" />
            </div>
            <div class="form-group">
              <label>Description</label>
              <textarea v-model="description" class="form-control"></textarea>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-primary btn-sm" @click="updateChapter" :disabled="saving">
              {{ saving ? "Saving..." : "Update" }}
            </button>
            <button class="btn btn-secondary btn-sm" @click="$emit('close')">Cancel</button>
          </div>
        </div>
      </div>
    </div>
  `
};
