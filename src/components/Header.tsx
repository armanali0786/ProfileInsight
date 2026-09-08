import React, { useEffect, useState, useRef } from "react";
import RevilLogo from "../assets/images/petrochina.png";
import UserProfile from "../assets/images/user-profile.png";
import { FaUserCircle } from "react-icons/fa";
import DownArror from "../assets/images/down-arror.png";
import LogoutIcon from "../assets/images/logout.png";
import EditFillIcon from "../assets/images/edit-fill.png";
import { useNavigate, useLocation } from "react-router-dom";
import closeIcon from "../assets/images/close.png";

type HeaderProps = {
  setIsLoggedIn: React.Dispatch<React.SetStateAction<boolean>>;
  isLoggedIn: boolean;
  forgotPasswordSteps: number;
  setForgotPasswordSteps: React.Dispatch<React.SetStateAction<number>>;
  userData: any;
  reviews: any;
  setReviews: React.Dispatch<React.SetStateAction<any>>;
  totalReviews: number;
  reviewerTotalReviewCount: number;
};

export default function Header({
  isLoggedIn,
  forgotPasswordSteps,
  setForgotPasswordSteps,
  userData,
  setIsLoggedIn,
  reviews,
  setReviews,
  totalReviews,
  reviewerTotalReviewCount
}: HeaderProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [isLogoutDropdownOpen, setIsLogoutDropdownOpen] = useState(false);
  const actionRef = useRef<HTMLDivElement | null>(null);
  const [version, setVersion] = useState("");

  /*-------------- Action Dropdown Hide, Click Outside EventListener --------------*/
  useEffect(() => {
    const handleClick = (event) => {
      if (actionRef.current && !actionRef.current.contains(event.target)) {
        setIsLogoutDropdownOpen(false);
      }
    };

    document.addEventListener("click", handleClick);
    return () => {
      document.removeEventListener("click", handleClick);
    };
  }, []);

  /*--------------  Toggle  Action Dropdown--------------*/
  const toggleDropdown = () => {
    setIsLogoutDropdownOpen(!isLogoutDropdownOpen);
  };

  /*-------------- Retrieve Version of Chrome Extension --------------*/
  useEffect(() => {
    const manifestData = chrome.runtime.getManifest();
    setVersion(manifestData.version);
  }, []);

  /*-------------- Edit Profile Click to show profile Page  --------------*/
  const handleEditProfileClick = () => {
    navigate("/profile");
    setIsLogoutDropdownOpen(false);
  };

  /*-------------- Back Navigation on Pages --------------*/
  const handleBackNavigation = () => {
    switch (location.pathname) {
      case "/signup":
        if (userData) {
          navigate("/profile");
        } else {
          navigate("/");
        }
        break;
      case "/verify-otp":
        navigate("/signup");
        break;
      case "/forgot-password":
        if (forgotPasswordSteps === 1) {
          navigate("/login");
        } else if (forgotPasswordSteps === 2) {
          setForgotPasswordSteps(1);
        } else if (forgotPasswordSteps === 3) {
          setForgotPasswordSteps(2);
        }
        break;
      default:
        navigate(-1);
    }
  };

  /*-------------- No Back Button on these Pages --------------*/
  const noBackButtonPaths = ["/", "/reviews", "/profile", "/login","/unlock-profile"];
  const ShowUnlockMessage = ["/reviews"];

  const remainingReviews = reviewerTotalReviewCount < 3 ? 3 - reviewerTotalReviewCount : 0;
  
  return (
    <>
      {reviewerTotalReviewCount !== undefined && reviewerTotalReviewCount !== null ? (
          // Proceed with the unlock message logic only if the above condition is true
          ShowUnlockMessage.includes(location.pathname) && remainingReviews === 0 ? (
            <>
              {/* <div className="bg-accent text-center p-2 bg-[#ffbf72]">
                <span className="text-muted-foreground text-black">
                  Your profile is available. Click here to see.
                </span>
              </div> */}
            </>
          ) : ShowUnlockMessage.includes(location.pathname) && reviews.length < 3 ? (
            <div className="bg-accent text-center p-2 bg-[#EBF3FC]">
              <span className="text-muted-foreground text-[#004182]">
                Your profile is locked. Review {remainingReviews} profile(s) to unlock.
              </span>
            </div>
          ) : null
        ) : null} 

      <div className="Header justify-between">
        <div className="flex items-center gap-2.5">
          {/* <img src={RevilLogo} alt="Revil Logo" className="w-[26px] h-[26px]" /> */}
          <div className="text-[20px] font-semibold text-WhiteColor capitalize leading-[1]">
            ProfileInsight
          </div>
        </div>
        {isLoggedIn && (
          <div ref={actionRef} className="relative flex items-center">
            <button onClick={toggleDropdown}>
              <img
                src={UserProfile}
                alt="User Profile"
                className="h-[26px] w-[26px]"
              />
            </button>
            {isLogoutDropdownOpen && (
              <ul className="Dropdown">
                <li className="DropdownItems">
                  <a className="" onClick={handleEditProfileClick}>
                    <div>Edit Profile</div>
                    <img src={EditFillIcon} className="h18w18" />
                  </a>
                </li>
                <li className="DropdownItems">
                  <a
                    onClick={() => {
                      setIsLoggedIn(false);
                      setIsLogoutDropdownOpen(false);
                      navigate("/signup");
                      localStorage.removeItem("LoginUserData");
                    }}
                    className=""
                  >
                    <div>Logout</div>
                    <img src={LogoutIcon} className="h18w18" />
                  </a>
                </li>
              </ul>
            )}
          </div>
        )}
        {!noBackButtonPaths.includes(location.pathname) && (
          <button
            className="flex gap-[5px] items-center btn py-1 pr-0 text-WhiteColor"
            onClick={handleBackNavigation}
          >
            <img src={DownArror} className=" rotate-90 h-4 w-4 invert" />
            <span>Back</span>
          </button>
        )}
        {location.pathname === "/login" && (
          <button
            className="flex gap-[5px] items-center btn py-1 pr-0 text-WhiteColor"
            onClick={() => navigate("/")}
          >
            <img src={DownArror} className=" rotate-90 h-4 w-4 invert" />
            <span>Back</span>
          </button>
        )}
      </div>
    </>
  );
}
