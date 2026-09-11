import React, { useEffect, useRef, useState } from 'react'
import toast, { Toaster } from 'react-hot-toast';
import UserIcon from '../assets/images/user.png';
import EditFillIcon from '../assets/images/edit-fill.png';
import closeIcon from '../assets/images/close.png';
import UserProfile from '../assets/images/user-profile.png';
import HalfRetingStar from '../assets/images/half-star.png';
import OneRetingStar from '../assets/images/one-star.png';
import PremiumIcon from '../assets/images/premium-icon.png';
import TomCookUserProfile from "../assets/images/tom-cook-user.png";
import FollowersIcon from "../assets/images/followers.png";
import FollowingIcon from "../assets/images/following.png";
import DownArrorIcon from "../assets/images/down-arror.png";
import PersonalInformationIcon from "../assets/images/personal-information.png";
import MyReviewIcon from "../assets/images/user-review.png";
import VerifiedIcon from "../assets/images/verified.png";
import ShortListIcon from "../assets/images/short-list.png";
import UserListIcon from "../assets/images/user-list.png";
import ReferralIcon from "../assets/images/referral.png";
import SettingsIcon from "../assets/images/settings.png";
import {  getLoginUserData } from "../indexedDB";
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthData, API_BASE_URL } from "../config";


type ProfileProps = {
    handleEditProfile: () => Promise<void>;
    reviewerTotalReviewCount: number;
    setMyProfileImage?: (image: string | null) => void;
  };

  type UserProfileData = {
    firstname?: string;
    lastname?: string;
    email?: string;
    profile_image?: string;
    active?: string;
};

export default function ProfilePage({
    // setIsProfilePageOpen,
    reviewerTotalReviewCount,
     handleEditProfile,
     setMyProfileImage}:ProfileProps) {
    const navigate = useNavigate();
    const [userProfileData, setUserProfileData] =  useState<UserProfileData | null>(null);
    const [loading, setLoading] = useState(true);
    const [uploadingImage, setUploadingImage] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const MAX_PROFILE_IMAGE_SIZE = 1024 * 1024; // 1MB

    /*-------------- Upload / Change Profile Image  ---------------*/
    const handleProfileImageClick = () => {
        if (!uploadingImage) fileInputRef.current?.click();
    };

    const handleProfileImageChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        event.target.value = ""; // Allow re-selecting the same file later
        if (!file) return;

        if (!file.type.startsWith("image/")) {
            toast.error("Please select an image file.");
            return;
        }
        if (file.size > MAX_PROFILE_IMAGE_SIZE) {
            toast.error("Image is too large. Maximum allowed size is 1MB.");
            return;
        }

        try {
            setUploadingImage(true);
            const userInfo = localStorage.getItem("LoginUserData");
            const parsedInfo = JSON.parse(userInfo!);
            const contactId = parsedInfo.contact_id;

            const formData = new FormData();
            formData.append("contact_id", contactId);
            formData.append("profile_image", file);

            const response = await axios.post(
                `${API_BASE_URL}/admin/api/contacts/upload_profile_image`,
                formData,
                {
                    headers: {
                        "Content-Type": "multipart/form-data",
                        authtoken: AuthData.token,
                    },
                }
            );

            if (response.status === 200) {
                toast.success(response.data.message || "Profile image updated.");
                setUserProfileData((prev) => ({ ...prev, profile_image: response.data.data.profile_image }));
                setMyProfileImage?.(response.data.data.profile_image);
                const updatedLoginData = { ...parsedInfo, ...response.data.data };
                localStorage.setItem("LoginUserData", JSON.stringify(updatedLoginData));
            }
        } catch (error: any) {
            toast.error(error?.response?.data?.message || "Failed to upload profile image.");
        } finally {
            setUploadingImage(false);
        }
    };

    /*-------------- Retrieve EditProfile Data  ---------------*/
    const handleEditProfileData = async () => {
        try {
            const userInfo = localStorage.getItem("LoginUserData");
            const parsedInfo = JSON.parse(userInfo!);
            const contactId = parsedInfo.contact_id; 

            const response = await axios.get(
                `${API_BASE_URL}/admin/api/contacts/data/1/${contactId}`,
                {
                    headers: {
                        "Content-Type": "multipart/form-data",
                        authtoken: AuthData.token,
                    },
                }
            );
            const userLoginData = response.data;
            if (userLoginData) {
                setUserProfileData(userLoginData);
            } else {
                setUserProfileData(null);
            }
        } catch (error) {
            console.log("Error fetching user data", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        handleEditProfileData();
    }, []);

    return (
        <>
            <Toaster position="top-center" reverseOrder={false} gutter={8} toastOptions={{ duration: 3000 }} />
            <div className=' flex flex-col absolute bottom-0 w-full rounded-t-[15px] min-h-screen bg-WhiteColor shadow-add-review-shadow'>
                <div className=" flex items-center justify-between px-[20px] py-[15px] border-b border-BorderColor-15">
                    <div className=" flex items-center gap-[10px]">
                        <img 
                        src={UserIcon} 
                        className="h18w18" />
                        <div className=" text-base">
                            Profile
                        </div>
                    </div>
                    <button 
                    onClick={()=>{navigate('/reviews')}}
                    >
                        <img src={closeIcon} className="h18w18" />
                    </button>
                </div>
                <div className="ScrollableContent">
                    <div className="p-[15px] mx-[-20px] items-center flex gap-[12px]">
                        <div className="relative h-[60px] w-[60px] shrink-0">
                            <div
                                className="rounded-full h-[60px] w-[60px] overflow-hidden cursor-pointer"
                                onClick={handleProfileImageClick}
                            >
                                <img
                                    src={userProfileData?.profile_image ? `${API_BASE_URL}/uploads/profile/${userProfileData.profile_image}` : UserProfile}
                                    className={`object-cover h-full w-full ${uploadingImage ? "opacity-50" : ""}`}
                                />
                            </div>
                            <button
                                type="button"
                                onClick={handleProfileImageClick}
                                disabled={uploadingImage}
                                className="absolute bottom-0 right-0 h-[22px] w-[22px] rounded-full bg-LinkedInBlue border-2 border-WhiteColor flex items-center justify-center"
                            >
                                <img src={EditFillIcon} className="h-[11px] w-[11px]" style={{ filter: "invert(1)" }} />
                            </button>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={handleProfileImageChange}
                            />
                        </div>
                        <div className=" flex flex-col">
                            <div className="text-[20px] font-semibold leading-[22px]">
                            {loading ? "Loading..." : userProfileData ? `${userProfileData.firstname || ''} ${userProfileData.lastname || ''}` : "User not found"}
                            </div>
                            {/* <div className=" flex items-center gap-1">
                                <div className=" flex items-center gap-1">
                                    <img src={OneRetingStar} className="h-4 w-4" />
                                    <img src={OneRetingStar} className="h-4 w-4" />
                                    <img src={OneRetingStar} className="h-4 w-4" />
                                    <img src={OneRetingStar} className="h-4 w-4" />
                                    <img src={HalfRetingStar} className="h-4 w-4" />
                                </div>
                                <span className="font-semibold text-base">4.5</span>
                                <span className="text-[10px] text-BlackColor-60 mt-[-3px]">
                                    (50k reviews)
                                </span>
                            </div> */}
                        </div>
                    </div>
                    {/* <div className='bg-GrayBg p-[15px] rounded-[5px] flex items-center'>
                        <div className=' flex-grow border-r border-BorderColor-15 pr-[15px] gap-[2px] flex flex-col'>
                        <div className='flex items-center justify-center gap-2'>
                                <img src={FollowersIcon} className="h-[15px] w-[15px]"/>
                                <span className='text-BlackColor font-semibold text-base'>445</span>
                            </div>
                            <div className='text-xs text-BlackColor-60 text-center'>followers</div>
                        </div>
                        <div className='flex flex-col flex-grow pl-[15px] gap-[2px]'>
                        <div className='flex items-center justify-center gap-2'>
                                <img src={FollowingIcon} className="h-[15px] w-[15px]"/>
                                <span className='text-BlackColor font-semibold text-base'>15</span>
                            </div>
                            <div className='text-xs text-BlackColor-60 text-center'>following</div>
                        </div>
                    </div> */}
                    {/* tabs start */}
                    <div className='TamsMain'>
                        <a className='TamsItems' onClick={() => navigate('/my-reviews')}>
                            <div className='flex items-center gap-2 w-[calc(100%-50px)]'
                                >
                                <img src={MyReviewIcon} className="h-[18px] w-[18px]"/>
                                <div className='text-BlackColor text-base truncate w-[calc(100%-30px)]'>My Reviews</div>
                            </div>
                            <div className=' flex items-center gap-[10px]'>
                                <div className='Pill'>{reviewerTotalReviewCount || 0}</div>
                                <img src={DownArrorIcon} className="h-[15px] w-[15px] -rotate-90"/>
                            </div>
                        </a>
                        <a className='TamsItems' onClick={() => navigate('/verification-requests')}>
                            <div className='flex items-center gap-2 w-[calc(100%-50px)]'
                                >
                                <img src={VerifiedIcon} className="h-[18px] w-[18px]"/>
                                <div className='text-BlackColor text-base truncate w-[calc(100%-30px)]'>Verification Requests</div>
                            </div>
                            <div className=' flex items-center gap-[10px]'>
                                <img src={DownArrorIcon} className="h-[15px] w-[15px] -rotate-90"/>
                            </div>
                        </a>
                        <a className='TamsItems' onClick={() => navigate('/reference-requests')}>
                            <div className='flex items-center gap-2 w-[calc(100%-50px)]'
                                >
                                <img src={ShortListIcon} className="h-[18px] w-[18px]"/>
                                <div className='text-BlackColor text-base truncate w-[calc(100%-30px)]'>Reference Requests</div>
                            </div>
                            <div className=' flex items-center gap-[10px]'>
                                <img src={DownArrorIcon} className="h-[15px] w-[15px] -rotate-90"/>
                            </div>
                        </a>
                        <a className='TamsItems' onClick={() => navigate('/dashboard')}>
                            <div className='flex items-center gap-2 w-[calc(100%-50px)]'
                                >
                                <img src={UserListIcon} className="h-[18px] w-[18px]"/>
                                <div className='text-BlackColor text-base truncate w-[calc(100%-30px)]'>Recruiter Dashboard</div>
                            </div>
                            <div className=' flex items-center gap-[10px]'>
                                <img src={DownArrorIcon} className="h-[15px] w-[15px] -rotate-90"/>
                            </div>
                        </a>
                        <a className='TamsItems' onClick={() => navigate('/personal-information')}>
                            <div className='flex items-center gap-2 w-[calc(100%-50px)]'
                                >
                                <img src={PersonalInformationIcon} className="h-[18px] w-[18px]"/>
                                <div className='text-BlackColor text-base truncate w-[calc(100%-30px)]'>Personal Information</div>
                            </div>
                            <div className=' flex items-center gap-[10px]'>
                                <img src={DownArrorIcon} className="h-[15px] w-[15px] -rotate-90"/>
                            </div>
                        </a>
                        <a className='TamsItems'>
                            <div className='flex items-center gap-2 w-[calc(100%-50px)]'>
                                <img src={ReferralIcon} className="h-[18px] w-[18px]"/>
                                <div className='text-BlackColor text-base truncate w-[calc(100%-30px)]'>Referral</div>
                            </div>
                            <div className=' flex items-center gap-[10px]'>
                                <img src={DownArrorIcon} className="h-[15px] w-[15px] -rotate-90"/>
                            </div>
                        </a>
                        <a className='TamsItems'>
                            <div className='flex items-center gap-2 w-[calc(100%-50px)]'>
                                <img src={SettingsIcon} className="h-[18px] w-[18px]"/>
                                <div className='text-BlackColor text-base truncate w-[calc(100%-30px)]'>Settings</div>
                            </div>
                            <div className=' flex items-center gap-[10px]'>
                                <img src={DownArrorIcon} className="h-[15px] w-[15px] -rotate-90"/>
                            </div>
                        </a>
                    </div>

                </div>
                <div className="Footer">
                    <button
                        type="submit"
                        className="w-full premium-btn btn flex items-center justify-center gap-[10px]"

                    >
                        <img src={PremiumIcon} />
                        <span>Premium</span>
                    </button>
                </div>
            </div>
        </>
    )
}
