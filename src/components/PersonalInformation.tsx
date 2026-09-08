import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast";
import UserIcon from "../assets/images/user.png";
import closeIcon from "../assets/images/close.png";
import { AuthData, API_BASE_URL } from "../config";

type PersonalInfo = {
  firstname: string;
  lastname: string;
  email: string;
};

const personalInfoSchema = Yup.object().shape({
  firstname: Yup.string().trim().required("First name is required."),
  lastname: Yup.string().trim(),
  email: Yup.string().trim().email("Enter a valid email.").required("Email is required."),
});

export default function PersonalInformation() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [initialValues, setInitialValues] = useState<PersonalInfo>({
    firstname: "",
    lastname: "",
    email: "",
  });

  const userInfo = localStorage.getItem("LoginUserData");
  const parsedInfo = userInfo ? JSON.parse(userInfo) : null;
  const contactId = parsedInfo?.contact_id;

  /*-------------- Fetch Current Personal Information ----------------*/
  const fetchPersonalInfo = async () => {
    if (!contactId) {
      setLoading(false);
      return;
    }
    try {
      const response = await axios.get(
        `${API_BASE_URL}/admin/api/contacts/data/1/${contactId}`,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            authtoken: AuthData.token,
          },
        }
      );
      const data = response.data;
      setInitialValues({
        firstname: data?.firstname || "",
        lastname: data?.lastname || "",
        email: data?.email || "",
      });
    } catch (error) {
      console.error("Error fetching personal information:", error);
      toast.error("Could not load your personal information.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPersonalInfo();
  }, []);

  /*-------------- Update Personal Information ----------------*/
  const handleUpdatePersonalInfo = async (values: PersonalInfo, { setSubmitting }) => {
    try {
      const formData = new FormData();
      formData.append("contact_id", contactId);
      formData.append("firstname", values.firstname.trim());
      formData.append("lastname", values.lastname.trim());
      formData.append("email", values.email.trim());

      const response = await axios.post(
        `${API_BASE_URL}/admin/api/contacts/update_profile`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            authtoken: AuthData.token,
          },
        }
      );

      if (response.status === 200) {
        toast.success(response.data.message || "Personal information updated.");
        if (parsedInfo) {
          const updatedLoginData = { ...parsedInfo, ...response.data.data };
          localStorage.setItem("LoginUserData", JSON.stringify(updatedLoginData));
        }
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to update personal information.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Toaster position="top-center" reverseOrder={false} gutter={8} toastOptions={{ duration: 3000 }} />
      <div className="flex flex-col absolute bottom-0 w-full rounded-t-[15px] min-h-screen bg-WhiteColor shadow-add-review-shadow">
        <div className="flex items-center justify-between px-[20px] py-[15px] border-b border-BorderColor-15">
          <div className="flex items-center gap-[10px]">
            <img src={UserIcon} className="h18w18" />
            <div className="text-base">Personal Information</div>
          </div>
          <button onClick={() => navigate("/profile")}>
            <img src={closeIcon} className="h18w18" />
          </button>
        </div>
        <div className="ScrollableContent flex flex-col flex-grow">
          {loading ? (
            <div className="text-center text-sm text-light-blue py-[30px]">Loading...</div>
          ) : (
            <Formik
              enableReinitialize
              initialValues={initialValues}
              validationSchema={personalInfoSchema}
              onSubmit={handleUpdatePersonalInfo}
            >
              {({ isSubmitting }) => (
                <Form className="flex flex-col flex-grow gap-[20px] py-[20px]">
                  <div className="flex flex-col gap-[6px]">
                    <label htmlFor="firstname" className="InputLabal">First Name</label>
                    <Field
                      type="text"
                      id="firstname"
                      name="firstname"
                      className="FromInput"
                      placeholder="Enter your first name"
                      autoComplete="off"
                    />
                    <ErrorMessage name="firstname" component="div" className="InputValidation" />
                  </div>
                  <div className="flex flex-col gap-[6px]">
                    <label htmlFor="lastname" className="InputLabal">Last Name</label>
                    <Field
                      type="text"
                      id="lastname"
                      name="lastname"
                      className="FromInput"
                      placeholder="Enter your last name"
                      autoComplete="off"
                    />
                    <ErrorMessage name="lastname" component="div" className="InputValidation" />
                  </div>
                  <div className="flex flex-col gap-[6px]">
                    <label htmlFor="email" className="InputLabal">Email</label>
                    <Field
                      type="email"
                      id="email"
                      name="email"
                      className="FromInput"
                      placeholder="Enter your email"
                      autoComplete="off"
                    />
                    <ErrorMessage name="email" component="div" className="InputValidation" />
                  </div>
                  <div className="Footer !px-0 mt-auto">
                    <button type="submit" className="w-full sign-in-btn btn" disabled={isSubmitting}>
                      {isSubmitting ? "Saving..." : "Save Changes"}
                    </button>
                  </div>
                </Form>
              )}
            </Formik>
          )}
        </div>
      </div>
    </>
  );
}
