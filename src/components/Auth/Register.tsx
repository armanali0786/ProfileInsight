import React, { useState, useEffect, useRef } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import {  addLinkedInUser } from "../../indexedDB";
import toast, { Toaster } from 'react-hot-toast';
import { useNavigate } from "react-router-dom";
import LinkedinIcon from "../../assets/images/linkedin-icon.png";
import { LinkedInApi } from "../../config";
import Loader from "../Loader/Loader";
import { AuthData, API_BASE_URL } from "../../config";

export default function Register({ isLoggedIn, setIsLoggedIn, fetchTotalReviewCount }) {
  const initialState = {};
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();

  /*------------------  Validation for Registration User  ----------------------*/
  const createAccountSchema = Yup.object().shape({});

  /*------------------  Create Registration  ----------------------*/
  const handleCreateAccount = async (values) => {};

  /*-------------- Register and Login with LinkedIn Auth  ----------------*/
  const RegisterWithLinkedIn = (type) => {
    const linkedInAuthUrl = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${LinkedInApi.clientId}&redirect_uri=${LinkedInApi.redirectUri}&state=${LinkedInApi.state}&scope=openid,profile,email`;
    chrome.identity.launchWebAuthFlow(
      {
        url: linkedInAuthUrl,
        interactive: true,
      },
      function (redirectUrl) {
        // Handle the redirect and extract the authorization code
        const urlParams = new URLSearchParams(new URL(redirectUrl).search);
        const code = urlParams.get("code");
        const state = urlParams.get("state");
        console.log(code);
        if (code) {
          LoginWithLinkedIn(code, state, type);
        }
      }
    );
  };

/*-------------- Login with LinkedIn  ----------------*/
  async function LoginWithLinkedIn(code, state, type) {
    try {
      setIsLoading(true);
      const response = await fetch(
        `${API_BASE_URL}/admin/api/contacts/data`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            authtoken: AuthData.token
          },
          body: JSON.stringify({ code, state, method: "li_auth", type: type, ext_id: chrome.runtime.id}),
        }
      );
      const responseData = await response.json();
      console.log("Response Auth Register: ", responseData.data)
      if (response.status == 201) {
        try {
          await addLinkedInUser(responseData.data);
          setIsLoggedIn(true);
          localStorage.setItem("LoginUserData", JSON.stringify(responseData.data));
          fetchTotalReviewCount()
          navigate(`/reviews`);
        } catch (error) {
          console.error("Error saving user to IndexedDB:", error);
        }
      } else if (response.status === 200) {
        setIsLoggedIn(true);
        localStorage.setItem("LoginUserData", JSON.stringify(responseData.data));
        fetchTotalReviewCount()
        navigate(`/reviews`);
      } else if (response.status === 409) {
        toast.error("You are already Registered.");
        setIsLoggedIn(false);
      } else if (response.status === 403) {
        toast.error("You are not Registered.");
        setIsLoggedIn(false);
      }else if (response.status === 404) {
        toast.error("Data not found.");
        setIsLoggedIn(false);
      }
      else {
        toast.error("LinkedIn login failed.");
      }
    } catch (error) {
      console.error("Error during LinkedIn login:", error);
      // toast.error("An error occurred. Please try again.");
      handleApiError(error.response.data)

    } finally {
      setIsLoading(false);
    }
  }

  /*-------------- Handle Api Error  ----------------*/
  const handleApiError = (response) => {
    toast.error(response.message || "Something went wrong.");
  };


  return (
    <>
       <Toaster
      position="top-center"
      reverseOrder={false}
      gutter={8}
      toastOptions={{
        duration: 3000,
      }}
      />
      {isLoading ? (
        <Loader
          existingReview={null}
          errorMessage={null}
          handleEditReview={undefined}
          handleCancel={undefined}
          loadingMessage={null}
          isLinkedIn={undefined}
          actionDropdownOpen={false}
          expandedReviewText={null}
          ExpandReviewText={undefined}
          setActionDropdownOpen={undefined}
        />
      ) : (
        <>
          <div className="ScrollableContent !max-h-[calc(100vh-110px)]">
            <Formik
              initialValues={initialState}
              validationSchema={createAccountSchema}
              onSubmit={handleCreateAccount}
              validateOnBlur={true}
              validateOnChange={true}
            >
              {({
                values,
                validateForm,
                errors,
                touched,
                setFieldTouched,
                setFieldError,
              }) => (
                <Form className="space-y-4 flex flex-col flex-grow">
                  <div className=" flex flex-col my-auto gap-[30px]">
                    <div className=" flex flex-col gap-2 mt-auto">
                      <h1 className="text-BlackColor text-[20px] font-semibold text-center capitalize">
                        "Sign up to continue"
                      </h1>
                      <div className="text-light-blue text-xs text-center leading-[1.5]">
                        Fill the following form
                      </div>
                    </div>
                    <div className="flex flex-col gap-[40px]">
                      {/* <div className=" flex flex-col gap-[25px]">
                        <div className=" relative">
                          <Field
                            type="email"
                            id="email"
                            name="email"
                            className="FromInput"
                            placeholder="Enter your Email"
                            autoComplete="off"
                          />
                          <ErrorMessage
                            name="email"
                            component="div"
                            className="InputValidation"
                          />
                        </div>
                      </div> */}
                      <button
                        className="linkedin-btn btn"
                        type="button"
                        onClick={() => RegisterWithLinkedIn("signup")}
                      >
                        <img src={LinkedinIcon} className="w-[24px]" />
                        <span>Continue with Linkedin</span>
                      </button>
                    </div>
                  </div>
                </Form>
              )}
            </Formik>
          </div>
          <div className="Footer flex-col gap-[12px] pt-0">
            <div className="text-light-blue text-xs text-center leading-[1.5]">
              Already have an account?
            </div>
            <button
              type="submit"
              className="w-full linkedin-btn btn font-semibold"
              onClick={() => RegisterWithLinkedIn("signin")}
            >
              <span>Sign in</span>
            </button>
          </div>
        </>
      )}
    </>
  );
}
