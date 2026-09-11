import React, { useState, useEffect } from "react";
import {
  Routes,
  Route,
  Link,
  useNavigate,
  useLocation,
} from "react-router-dom";
import { AuthData, API_BASE_URL } from "../config";
import toast, { Toaster } from 'react-hot-toast';
import Review from "../components/Review";
import SignUp from "../components/Auth/SignUp";
import Login from "../components/Auth/Login";
import GetStartedPage from "../components/GetStartedPage";
import Header from "../components/Header";
import ProfilePage from "../components/ProfilePage";
import MyReviews from "../components/MyReviews";
import VerificationRequests from "../components/VerificationRequests";
import PersonalInformation from "../components/PersonalInformation";
import {
  initDB,
  getTotalReviews
} from "../indexedDB";
import ReviewPage from "../components/Reviews/ReviewPage";
import Register from "../components/Auth/Register";
import ReviewRelations from "../components/ReviewRelations";
import SocialLogin from "../components/Auth/SocialLogin";
import axios from "axios";
function SidePanel() {
  const [userData, setUserData] = useState(null);
  const [linkedInUserId, setLinkedInUserId] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [forgotPasswordSteps, setForgotPasswordSteps] = useState(1);
  const [reviews, setReviews] = useState([]);
  const [db, setDb] = useState(null);
  const [totalReviews, setTotalReviews] = useState();
  const  [reviewerTotalReviewCount, setReviewerTotalReviewCount] = useState(null);
  // The logged-in user's own avatar, shared across Header, the review list, and
  // the add-review flow so a new upload in ProfilePage reflects everywhere at
  // once instead of only after those components independently refetch.
  const [myProfileImage, setMyProfileImage] = useState(() => {
    try {
      const stored = JSON.parse(localStorage.getItem("LoginUserData") || "null");
      return stored?.profile_image || null;
    } catch {
      return null;
    }
  });
  const navigate = useNavigate();
  const location = useLocation();

  /*------------------  IndexedDB initialized ----------------------*/
  useEffect(() => {
    initDB()
      .then(() => {
        console.log("IndexedDB initialized");
      })
      .catch((error) => {
        console.error(error);
      });
    const StoreUserData = localStorage.getItem("LoginUserData");
    if (StoreUserData) {
      setIsLoggedIn(true);
      navigate("/reviews");
    } else {
      setIsLoggedIn(false);
      navigate("/");
    }
  }, []);




  /*------------------ Fetch Total Reviews Length ----------------------*/
  const fetchAllReviews = async () => {
    const userInfo = localStorage.getItem("LoginUserData");
    if (!userInfo) {
      return;
    }
    try {
      const parsedInfo = JSON.parse(userInfo);
      const contactId = parsedInfo.contact_id;
      const database = await initDB();
      setDb(database);
      const reviewsData = await getTotalReviews(database, contactId);
      setTotalReviews(reviewsData.length);
    } catch (error) {
      console.error("Error fetching all reviews:", error);
    }
  };
  useEffect(() => {
    fetchAllReviews();
  }, []);

  /*------------------ Edit Profile Click  ----------------------*/
  const handleEditProfile = async () => {
    try {
      // const userId = localStorage.getItem("logInUserId");
      // const user = await getUser(userId);
      // if (user) {
      //   navigate("/signup");
      //   setUserData(user);
      // }
    } catch (error) {
      console.log("Error getting user", error);
    }
  };



  const initializeDatabase = async () => {
    try {
      const database = await initDB(); // Assuming `initDB` initializes the IndexedDB
      console.log("Database initialized:", database);
      setDb(database);
    } catch (error) {
      console.error("Database initialization failed:", error);
    }
  };
  useEffect(() => {
    initializeDatabase();
  }, [linkedInUserId]);

  /*------------------ Fetch total reviews counts ----------------------*/
  const fetchTotalReviewCount = async() => {
    const userInfo = localStorage.getItem("LoginUserData");
    if (!userInfo) {
      return;
    }
    try{
      const parsedInfo = JSON.parse(userInfo);
      const contactId = parsedInfo.contact_id;
      const formData = new FormData();
      formData.append("contact_id", contactId);
      const responsData = await axios.post(
        `${API_BASE_URL}/admin/reviews/get_profile_public_data`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            authtoken:AuthData.token,
          },
        }
      );
      const publicProfileData = responsData.data.data;
      if(responsData.status == 200){
        setReviewerTotalReviewCount(publicProfileData.reviewer_total_review_count);
      }

    }catch (error) {
      handleApiError(error?.response?.data || { message: error?.message });
    }
  };
  
  useEffect(()=>{
    fetchTotalReviewCount();
  },[linkedInUserId]);

  const handleApiError = (response) => {
    toast.error(response?.message || "Something went wrong.");
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
      <div className={`Main ${location.pathname == "/" ? "WithBgImg" : ""}`}>
        <Header
          setIsLoggedIn={setIsLoggedIn}
          isLoggedIn={isLoggedIn}
          setForgotPasswordSteps={setForgotPasswordSteps}
          forgotPasswordSteps={forgotPasswordSteps}
          userData={userData}
          setReviews={setReviews}
          reviews={reviews}
          totalReviews={totalReviews}
          reviewerTotalReviewCount={reviewerTotalReviewCount}
          myProfileImage={myProfileImage}
        />
        <Routes>
          <Route path="/" element={<GetStartedPage />} />
          {/* <Route path="/signup" element={<SignUp userData={userData}/>} /> */}
          {/* <Route path="/signup" element={<SocialLogin />} /> */}
          <Route
            path="/signup"
            element={
              <Register setIsLoggedIn={setIsLoggedIn} isLoggedIn={isLoggedIn} fetchTotalReviewCount={fetchTotalReviewCount} />
            }
          />
          {/* <Route
            path="/login"
            element={<Login setIsLoggedIn={setIsLoggedIn} />}
          /> */}
          {/* <Route
            path="/forgot-password"
            element={
              <ForgetPassword
                setForgotPasswordSteps={setForgotPasswordSteps}
                forgotPasswordSteps={forgotPasswordSteps}
              />
            }
          />
          <Route path="/verify-otp" element={<VerifyEmail />} /> */}
          <Route
            path="/reviews"
            element={
              <ReviewPage
                reviews={reviews}
                setReviews={setReviews}
                totalReviews={totalReviews}
                fetchAllReviews={fetchAllReviews}
                reviewerTotalReviewCount={reviewerTotalReviewCount}
                setReviewerTotalReviewCount={setReviewerTotalReviewCount}
                fetchTotalReviewCount={fetchTotalReviewCount}
                myProfileImage={myProfileImage}
              />
            }
          />
          <Route
            path="/unlock-profile"
            element={
              <ReviewRelations reviewerTotalReviewCount={reviewerTotalReviewCount}  />
            }
          />
          <Route
            path="/profile"
            element={
              <ProfilePage
                handleEditProfile={handleEditProfile}
                reviewerTotalReviewCount={reviewerTotalReviewCount}
                setMyProfileImage={setMyProfileImage}
              />
            }
          />
          <Route path="/my-reviews" element={<MyReviews />} />
          <Route path="/verification-requests" element={<VerificationRequests />} />
          <Route path="/personal-information" element={<PersonalInformation />} />
        </Routes>
      </div>
    </>
  );
}

export default SidePanel;
