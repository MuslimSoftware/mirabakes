import { apiUpload } from "@/frontend/api/http/client";

export const uploadsClient = {
  uploadImage(file: File, token: string) {
    const formData = new FormData();
    formData.append("file", file);

    return apiUpload<{ url: string }>("/api/v1/admin/uploads/image", formData, {
      "x-admin-token": token
    });
  }
};
