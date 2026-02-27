import { apiUpload } from "@/frontend/api/http/client";

export const uploadsClient = {
  uploadImage(file: File, productId: string, token: string) {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("productId", productId);

    return apiUpload<{ id: string; url: string }>("/api/v1/admin/uploads/image", formData, {
      "x-admin-token": token
    });
  }
};
