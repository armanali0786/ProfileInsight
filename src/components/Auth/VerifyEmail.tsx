import React, { useEffect, useState } from "react";
import VerifyMail from "../../assets/images/verify-mail.png";
import verified from "../../assets/images/verified.png";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { useNavigate } from "react-router-dom";
import { getUser , updateUser} from "../../indexedDB";
import Stars from '../../assets/images/stars.png';

export default function VerifyEmail({  }) {
  const [isVerification, setIsVerification] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [yourOtp , setYourOtp] = useState(null);
  const navigate = useNavigate();

  /*------------------  Otp Validation Schema  ----------------------*/
  const otpSchema = Yup.object().shape({
    otp1: Yup.string()
      .matches(/^\d$/, "Must be a single digit.")
      .required("Required."),
    otp2: Yup.string()
      .matches(/^\d$/, "Must be a single digit.")
      .required("Required."),
    otp3: Yup.string()
      .matches(/^\d$/, "Must be a single digit.")
      .required("Required."),
    otp4: Yup.string()
      .matches(/^\d$/, "Must be a single digit.")
      .required("Required."),
  });

  /*------------------  Retrieve Registration Otp from Localstorage  ----------------------*/
  const registrationOtpData = JSON.parse(localStorage.getItem("RegistrationOtp"));
  useEffect(()=>{
    // Retrieve the correct OTP from local storage
    const storedOtp = registrationOtpData?.otp;
    setYourOtp(storedOtp)
  },[])

  /*------------------ Handle Otp Verification ----------------------*/
  const handleVerifytOtp =async (values, { setSubmitting, setErrors }) => {
    const otp = `${values.otp1}${values.otp2}${values.otp3}${values.otp4}`;
    // Check if OTP is valid
    if (!/^\d{4}$/.test(otp)) {
      setErrorMessage("Please enter a valid OTP.");
      setSubmitting(false);
      return;
    }
    // Simulate OTP validation
    if (otp === yourOtp) {
      const userMailId = registrationOtpData?.email;
      const userData = await getUser(userMailId);
      if (userData) {
        await updateUser({ ...userData, isVerified: true });
        setIsVerification(true); 
        setTimeout(() => {
          navigate('/login');
          localStorage.removeItem("RegistrationOtp")
        }, 3000);
        setErrorMessage("");
      }
    } else {
      setErrorMessage("Invalid OTP. Please try again.");
    }
    setSubmitting(false);
  };

  return (
    <>
    <div className="ScrollableContent !max-h-[calc(100vh-62px)]">
      {/* Verify Your Email start  */}
      {!isVerification ? (
        <>
            <div className=" flex flex-col gap-[30px] flex-grow">
              <div className="flex flex-col items-center gap-[15px] flex-grow">
                {/* <img src={VerifyMail} className="h-[80px] w-[80px] mt-auto" /> */}
                <img src={Stars} className=' w-8 mt-auto' />
                <div className=" flex flex-col gap-[8px]">
                  <h1 className="text-BlackColor text-[20px] font-semibold text-center">
                    Verify Your OTP
                  </h1>
                  <div className="text-light-blue text-xs text-center leading-[1.5]">
                    We have sent a verification code to your email. Please head
                    there.
                  </div>
                  <p className="text-light-blue text-xs text-center leading-[1.5]">Your Otp: {yourOtp}</p>
                </div>
              </div>
              <Formik
                initialValues={{ otp1: "", otp2: "", otp3: "", otp4: "" }}
                validationSchema={otpSchema}
                onSubmit={handleVerifytOtp}
                validateOnBlur={false}
                validateOnChange={false}
              >
                {({ isSubmitting, errors, values }) => {
                  return (
                    <Form className="flex flex-col gap-[30px] flex-grow">
                      <div className="mb-auto">
                        <label htmlFor="email" className="InputLabel text-xs leading-[1.5]">
                          Please Enter a Valid OTP
                        </label>
                        <div className="relative flex items-center justify-between gap-[20px]">
                          {[1, 2, 3, 4].map((num) => (
                            <Field
                              key={num}
                              type="text"
                              id={`otp${num}`}
                              name={`otp${num}`}
                              className="FromInput text-center !border-transparent !border-b-BorderColor-15 !rounded-none"
                              placeholder=""
                              autoComplete="off"
                              maxLength={1}
                              onKeyUp={(e) => {
                                if (e.key === "Backspace") {
                                  if (num > 1) {
                                    const prevField = document.getElementById(
                                      `otp${num - 1}`
                                    );
                                    if (prevField) {
                                      prevField.focus();
                                    }
                                  }
                                } else if (e.key >= "0" && e.key <= "9") {
                                  if (num < 4) {
                                    const nextField = document.getElementById(
                                      `otp${num + 1}`
                                    );
                                    if (nextField) {
                                      nextField.focus();
                                    }
                                  }
                                }
                              }}
                              onInput={(e) => {
                                // Only allow number input
                                if (!/^[0-9]$/.test(e.target.value)) {
                                  e.target.value = ""; // Clear invalid input
                                }
                              }}
                            />
                          ))}
                        </div>
                        {errorMessage && (
                          <div className="InputValidation text-center">
                            {errorMessage}
                          </div>
                        )}
                      </div>
                      <div className="Footer !px-0 flex flex-col gap-[20px] mt-auto">
                        <button
                          type="submit"
                          className="w-full sign-in-btn btn"
                        >
                          Verify OTP
                        </button>
                      </div>
                    </Form>
                  );
                }}
              </Formik>
            </div>

          {/* Verify Your Email end  */}
        </>
      ) : (
        // Your Email is Verified start *
        <div className="ScrollableContent border-t border-BorderColor-15">
          <div className=" flex flex-col gap-[30px] mt-auto">
            {/* <img src={VerifyMail} className='h-[80px] w-[80px]' /> */}
            <img src={verified} className="h-[80px] w-[80px]" />
            <div className=" flex flex-col gap-[15px]">
              <h1 className="text-[28px] text-BlackColor">
                Your OTP is Verified
              </h1>
              <div className="text-base">
                Congratulations! Your account has been verified.
              </div>
            </div>
          </div>
          <div className=" flex-grow flex justify-center items-center">
            <div className="loader"></div>
          </div>
          {/* Your Email is Verified end  */}
        </div>
      )}
    </div>
    </>
  );
}
