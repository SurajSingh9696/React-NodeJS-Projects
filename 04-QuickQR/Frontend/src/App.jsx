import React from 'react'
import Axios from "axios";
import { useForm } from "react-hook-form";

function App() {

  const { register, handleSubmit, watch, formState: { errors } } = useForm();
  const onSubmit = async () => {
    try {
      const formData = new FormData();
      formData.append("imageName", watch("imageName"));
      formData.append("image", watch("image")[0]);

      const res = await Axios.post("https://quickqr-backend-rsml.onrender.com/imageUpload", formData, {
        headers: {
          "Content-Type": "multipart/form-data"
        }
      });
      console.log(res.data.message);
      console.log(res.data.url);
    } catch (error) {
      console.error("Error uploading image:", error.message);
    }
  }



  return <>
    <form onSubmit={handleSubmit(onSubmit)}>
      <input type="text" {...register("imageName", { required: true })} />
      <input type="file" {...register("image", { required: true })} />
      <button type="submit">Generate QR Code</button>
    </form>
  </>
}

export default App
