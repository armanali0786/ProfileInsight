import React, { useState, useEffect, useRef } from "react";
import toast, { Toaster } from 'react-hot-toast';
import { FaEdit, FaFilter, FaStar } from "react-icons/fa";
import { MdDelete, MdCancel } from "react-icons/md";
import RetingStar from "../assets/images/reting-star.png";
import AddUser from "../assets/images/add-uesr.png";
import UserProfile from "../assets/images/user-profile.png";
import ThreeDots from "../assets/images/three-dots.png";
import OneRetingStar from "../assets/images/one-star.png";
import HalfRetingStar from "../assets/images/half-star.png";
import DownArror from "../assets/images/down-arror.png";
import EditIcon from "../assets/images/edit.png";
import DeleteIcon from "../assets/images/delete.png";
import { FaAngleUp, FaAngleDown } from "react-icons/fa";
import TomCookUserProfile from "../assets/images/tom-cook-user.png";
import SearchIcon from "../assets/images/search-icon.png";
import fillterIon from "../assets/images/fillter.png";
import NoDataFoundIcon from "../assets/images/no-data-found.png";
import closeIcon from "../assets/images/close.png";
import StarBlack15 from "../assets/images/start-black-15.png";

import {
  addReview,
  getReviewsByUserId,
  updateReview,
  deleteReview,
  initDB,
} from "../indexedDB";
import DeleteConfirmation from "./DeleteConfirmation";
import Loader from "./Loader/Loader";
import AddReview from "./AddReview";

function Review() {
  const [reviews, setReviews] = useState([]);
  const [newReview, setNewReview] = useState({
    name: "",
    text: "",
    rating: 1,
    linkedInUserId: "",
  });
  const [editIndex, setEditIndex] = useState(null);
  const [isLinkedIn, setIsLinkedIn] = useState(false);
  const [linkedInUserName, setLinkedInUserName] = useState("");
  const [linkedInUserId, setLinkedInUserId] = useState("");
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string[]>([]);
  const [db, setDb] = useState(null);
  const [isModalOpen, setModalOpen] = useState(false);
  const [actionDropdownOpen, setActionDropdownOpen] = useState(null);
  const [selectedReviewId, setSelectedReviewId] = useState(null);
  const [sortOption, setSortOption] = useState("all");
  const [isOpenSortOptions, setIsOpenSortOptions] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState(false);
  const [existingReview, setExistingReview] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [expandedReviewText, setExpandedReviewText] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [isExpandDescription, setIsExpandDescription] = useState(false);
  const [searchInputShow, setSearchInputShow] = useState(false);
  const [appliedSortOption, setAppliedSortOption] = useState("");
  const [appliedFilterType, setAppliedFilterType] = useState([]);

  const filterRef = useRef(null);
  const ActionRef = useRef([]);
  // const dropdownRef = useRef(null);
  const searchRef = useRef(null);

  class Review {
    createdAt: string;
  }

  /*-------------- Retrieve Reviews Data  ---------------*/
  useEffect(() => {
    const fetchReviews = async (database) => {
      const userId = localStorage.getItem("logInUserId");
      if (userId) {
        try {
          const userReviews = await getReviewsByUserId(userId, database);
          setReviews(userReviews || []); // Set reviews or an empty array if none are found
        } catch (error) {
          console.error("Failed to fetch reviews:", error);
        }
      } else {
        console.error("No userId found in localStorage");
      }
    };

    const initializeDatabase = async () => {
      const database = await initDB();
      console.log("Database initialized:", database);
      setDb(database);

      // Fetch reviews after the database is initialized
      await fetchReviews(database);
    };

    initializeDatabase();
  }, []);

  /*-------------- Delete Review  ---------------*/
  const handleDeleteReview = async () => {
    const userId = localStorage.getItem("logInUserId");
    const review = reviews.find((rev) => rev.reviewId === selectedReviewId);
    if (review && review.userId === userId) {
      try {
        await deleteReview(selectedReviewId, setReviews);
        toast("Review deleted successfully!");
        const updatedReviews = reviews.filter(
          (rev) => rev.reviewId !== selectedReviewId
        );
        setReviews(updatedReviews);
        setModalOpen(false); // Close the modal after deletion
      } catch (error) {
        toast.error("Error deleting review. Please try again.");
      }
    } else {
      toast.error("You can only delete your own reviews.");
      setModalOpen(false); // Close modal if deletion is not allowed
    }
  };

  /*-------------- Edit Review data  ---------------*/
  const handleEditReview = (reviewId) => {
    setLoading(false);
    const userId = localStorage.getItem("logInUserId");
    const review = reviews.find((rev) => rev.reviewId === reviewId);

    if (review && review.userId === userId) {
      // setNewReview(review);
      setNewReview({
        ...review,
        name: review.name,
        linkedInUserId: review.linkedInUserId,
        // name: isLinkedIn ? linkedInUserName : review.name
      });
      setEditIndex(reviews.findIndex((rev) => rev.reviewId === reviewId));
      setShowReviewForm(true);
    } else {
      toast.error("You can only edit your own reviews.");
    }
  };


  /*-------------- Handle Show Review Form & Validate whether its LikedIn page   ---------------*/
  const handleShowReviewForm = () => {
    const extractUserIdFromLinkedIn = (url) => {
      const regex = /linkedin\.com\/in\/([a-zA-Z0-9-]+)/;
      const match = url.match(regex);
      return match && match[1] ? match[1] : null; // Return user ID
    };

    const checkActiveTab = () => {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const url = tabs[0]?.url;
        setLoading(true);
        setLoadingMessage(true);
        setTimeout(() => {
          setLoading(false);
          // Check if the URL is a LinkedIn profile page
          if (url && url.match(/^https:\/\/www\.linkedin\.com\/in\/.+/)) {
            const userId = extractUserIdFromLinkedIn(url);

            // Check if userId is extracted
            if (userId) {
              setLinkedInUserId(userId);

              const AvailablelinkedInUserIds = reviews.map(
                (review) => review.linkedInUserId
              );
              const checkAlreadyReviewedProfile =
                AvailablelinkedInUserIds.includes(userId) && editIndex === null;

              if (!checkAlreadyReviewedProfile) {
                // Both conditions are true, show the review form
                chrome.storage.local.get(["linkedinUsername"], (result) => {
                  const linkedInUserName = result.linkedinUsername || "";
                  setLinkedInUserName(linkedInUserName);
                  // Store in localStorage
                  localStorage.setItem(
                    "reviewFormData",
                    JSON.stringify({
                      linkedInUserId: userId,
                      linkedInUsername: linkedInUserName,
                      text: "",
                      status: "pending",
                    })
                  );
                });

                // Show the review form
                setIsLinkedIn(true);
                setShowReviewForm(true);
              } else {
                // User ID is already available
                setIsLinkedIn(false);
                setShowReviewForm(false);
                const existingReview = reviews.find(
                  (review) => review.linkedInUserId === userId
                );
                setLoading(true);
                setExistingReview(existingReview);
                setLoadingMessage(false);
                setErrorMessage(
                  "You have already reviewed this LinkedIn profile!"
                );
              }
            } else {
              // User ID could not be extracted
              setIsLinkedIn(false);
              setShowReviewForm(false);
              setLoadingMessage(false);
              toast.error("Could not extract user ID from LinkedIn profile!");
            }
          } else {
            // Not a LinkedIn profile page
            setIsLinkedIn(false);
            setShowReviewForm(false);
            setLoading(true);
            setLoadingMessage(false);
            setErrorMessage("It's not a LinkedIn Profile Page!");
          }
        }, 3000);
      });
    };

    checkActiveTab();
  };

  /*-------------- Handle Search ---------------*/
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  /*-------------- Set the Filteration of reviews  ---------------*/
  const handleFilterChange = (e) => {
    const { value, checked } = e.target;
    setFilterType((prevFilter) => {
      if (checked) {
        // Add the rating to the filter if checked
        return [...prevFilter, value];
      } else {
        // Remove the rating from the filter if unchecked
        return prevFilter.filter((item) => item !== value);
      }
    });
  };

  /*-------------- Set the Filteration Dropdown  ---------------*/
  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  /*-------------- Popup Delete Model ---------------*/
  const openDeleteModal = (reviewId) => {
    setSelectedReviewId(reviewId);
    setModalOpen(true);
  };

  /*-------------- Apply Filteration Of Sorting & Filter  ---------------*/
  const applyFilters = () => {
    // Apply sorting and filtering
    setAppliedSortOption(sortOption);
    setAppliedFilterType(filterType);
    setIsDropdownOpen(false);
  };

  /*--------------  Filter Reviews Data ---------------*/
  const filteredReviews = reviews.filter((review) => {
    const lowerSearchTerm = searchTerm.toLowerCase();
    const matchesSearch =
      review.name.toLowerCase().includes(lowerSearchTerm) ||
      review.text.toLowerCase().includes(lowerSearchTerm);

    const matchesRating =
      appliedFilterType.length > 0
        ? appliedFilterType.includes(review.rating.toString())
        : true; // If no filter, all reviews match

    return matchesSearch && matchesRating;
  });

  /*-------------- Handle Sorting Option Change ---------------*/
  const handleSortChange = (option) => {
    setSortOption(option);
    setIsOpenSortOptions(false);
  };

  /*-------------- Handle sortedReviews Reviews ---------------*/
  const sortedReviews = [...filteredReviews].sort((a: Review, b: Review) => {
    const dateA = new Date(a.createdAt);
    const dateB = new Date(b.createdAt);
    if (appliedSortOption === "newest") {
      return dateB.getTime() - dateA.getTime();
    }
    if (appliedSortOption === "oldest") {
      return dateA.getTime() - dateB.getTime();
    }
    return 0;
    // if (sortOption === "newest") {
    //   return dateB.getTime() - dateA.getTime();
    // }
    // return dateA.getTime() - dateB.getTime();
  });

  /*-------------- Highlights the Text of (Name and Review Text) ---------------*/
  const highlightText = (text, searchTerm) => {
    if (!searchTerm) return text;
    const parts = text.split(new RegExp(`(${searchTerm})`, "gi"));
    return parts.map((part, index) =>
      part.toLowerCase() === searchTerm.toLowerCase() ? (
        <span key={index} style={{ backgroundColor: "yellow" }}>
          {part}
        </span>
      ) : (
        part
      )
    );
  };

  /*-------------- Handle Cancel ---------------*/
  const handleCancel = () => {
    setShowReviewForm(false);
    setActionDropdownOpen(null);
    setEditIndex(null);
    setLoading(false);
    setExistingReview(null);
    setErrorMessage(null);
  };

  /*-------------- Formate Date of Reviews ---------------*/
  const formatDate = (dateString) => {
    return new Date(dateString)
      .toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
      .replace(/\./g, ""); // Removes any dots if they appear in the month abbreviation
  };

  /*-------------- Expand Review Text based on reviewId ---------------*/
  const ExpandReviewText = (reviewId) => {
    setExpandedReviewText((prev) => ({
      ...prev,
      [reviewId]: !prev[reviewId],
    }));
  };

  /*-------------- Handle Multiple Dropdown (Search, Filter, Action) ---------------*/
  const handleActionDropdown = (reviewId) => {
    setActionDropdownOpen((prevId) => (prevId === reviewId ? null : reviewId));
  };

  const handleClickOutside = (event) => {
    if (!ActionRef.current.some((ref) => ref && ref.contains(event.target))) {
      setActionDropdownOpen(null);
    }
    if (filterRef.current && !filterRef.current.contains(event.target)) {
      setIsDropdownOpen(false);
    }
    if (searchRef.current && !searchRef.current.contains(event.target)) {
      setSearchInputShow(false);
    }
  };
  useEffect(() => {
    if (
      isOpenSortOptions ||
      actionDropdownOpen ||
      searchInputShow ||
      isDropdownOpen
    ) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpenSortOptions, actionDropdownOpen, searchInputShow, isDropdownOpen]);

  /*-------------- Pagination Ellipsis  Handling ---------------*/
  const reviewsPerPage = 3;
  const totalPages = Math.ceil(sortedReviews.length / reviewsPerPage);
  const startIndex = (currentPage - 1) * reviewsPerPage;
  const ReviewDatas = sortedReviews.slice(
    startIndex,
    startIndex + reviewsPerPage
  );

  /*-------------- Pagination Previous page ---------------*/
  const handlePreviousPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  /*-------------- Pagination Next page ---------------*/
  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  /*-------------- Set Current Page ---------------*/
  const handlePageClick = (page) => {
    setCurrentPage(page);
  };

  /*-------------- Render Pagination Items Ellipsis ---------------*/
  const renderPaginationItems = () => {
    const items = [];

    // Always show the first page
    items.push(
      <li key={1}>
        <button
          className={`PaginetionItems ${currentPage === 1 ? "active" : ""}`}
          onClick={() => handlePageClick(1)}
        >
          1
        </button>
      </li>
    );

    // If the current page is greater than 2, show an ellipsis
    if (currentPage > 2 && totalPages > 3) {
      items.push(<li key="start-ellipsis">...</li>);
    }

    // Show the current page if it's not the first or last page
    if (currentPage !== 1 && currentPage !== totalPages) {
      items.push(
        <li key={currentPage}>
          <button
            className="PaginetionItems active"
            onClick={() => handlePageClick(currentPage)}
          >
            {currentPage}
          </button>
        </li>
      );
    }

    // If the current page is less than totalPages - 1, show an ellipsis before the last page
    if (currentPage < totalPages - 1 && totalPages > 3) {
      items.push(<li key="end-ellipsis">...</li>);
    }

    // Always show the last page (if there are more than 1 page)
    if (totalPages > 1) {
      items.push(
        <li key={totalPages}>
          <button
            className={`PaginetionItems ${
              currentPage === totalPages ? "active" : ""
            }`}
            onClick={() => handlePageClick(totalPages)}
          >
            {totalPages}
          </button>
        </li>
      );
    }

    return items;
  };

  /*-------------- Retrieve the Review Message (Add  Update Reviews) ---------------*/
  useEffect(() => {
    const reviewAddMessage = localStorage.getItem("reviewMessage");
    toast.success(reviewAddMessage);
    setTimeout(() => {
      localStorage.removeItem("reviewMessage");
    }, 2000);
  }, []);

  const toggleExpand = () => {
    setIsExpandDescription(!isExpandDescription);
  };

  return (
    <>
      <Toaster />
     {/*-------------- Loader Component ---------------*/}
      {loading ? (
        <Loader
          existingReview={existingReview}
          errorMessage={errorMessage}
          handleEditReview={handleEditReview}
          handleCancel={handleCancel}
          loadingMessage={loadingMessage}
          isLinkedIn={isLinkedIn}
          actionDropdownOpen={actionDropdownOpen}
          expandedReviewText={expandedReviewText}
          setExpandedReviewText={setExpandedReviewText}
          ExpandReviewText={ExpandReviewText}
          setActionDropdownOpen={setActionDropdownOpen}
        />
      ) : (
        <>
         {/*-------------- Render All Reviews Data ---------------*/}
          {!showReviewForm && (
            <>
              <div className="ScrollableContent border-t border-BorderColor-15 relative">
                {/* reting statr  */}
                {/* <div className="p-[15px] flex flex-col gap-[10px] border-b border-BorderColor-15 mx-[-20px]">
                  <div className=" flex items-center gap-[12px] justify-between">
                    <div className="flex gap-[12px]">
                      <div className=" rounded-full h-[60px] w-[60px] overflow-hidden">
                        <img
                          src={TomCookUserProfile}
                          className=" object-cover h-full w-full"
                        />
                      </div>
                      <div className=" flex flex-col">
                        <div className="text-[20px] font-semibold leading-[22px]">
                          Tom Cook
                        </div>
                        <div className=" flex flex-col">
                          <div className=" flex items-center gap-1">
                            <div className=" flex items-center gap-1">
                              <img src={OneRetingStar} className="h-4 w-4" />
                              <img src={OneRetingStar} className="h-4 w-4" />
                              <img src={OneRetingStar} className="h-4 w-4" />
                              <img src={OneRetingStar} className="h-4 w-4" />
                              <img src={HalfRetingStar} className="h-4 w-4" />
                            </div>
                            <span className="font-semibold text-base">4.5</span>
                          </div>
                          <span className="text-[10px] text-BlackColor-60 mt-[-3px]">
                            (50k reviews)
                          </span>
                        </div>
                      </div>
                    </div>
                    <button className="h-[40px] w-[40px] rounded-md bg-YellowLight flex">
                      <img src={AddUser} className="m-auto h18w18" />
                    </button>
                  </div>
                  <div className="cursor-pointer">
                    <div
                      className={`text-[13px] text-BlackColor-60 leading-[14px] ${
                        isExpandDescription ? "" : "line-clamp-1"
                      }`}
                    >
                      Trusted real estate expert, helping clients find their
                      property with ease and expertise.
                    </div>
                    <span
                      className="text-LinkedInBlue font-semibold underline"
                      onClick={toggleExpand}
                    >
                      {isExpandDescription ? "Read less" : "Read more"}
                    </span>
                  </div>
                </div> */}
                {/* reting end  */}
                <div className="flex justify-between items-center mt-[15px] gap-2">
                  <div className=" text-sm text-BlackColor font-semibold capitalize">
                    reviews
                  </div>
                  <div className="flex items-center gap-[10px]">
                    <div
                      className={` relative flex justify-center items-center ${
                        searchInputShow
                          ? " min-w-[120px]"
                          : "border border-BorderColor-15 rounded-[5px] h-7 w-7"
                      }`}
                      ref={searchRef}
                    >
                      {searchInputShow && (
                        <input
                          type="text"
                          placeholder="Search"
                          value={searchTerm}
                          onChange={handleSearchChange}
                          className="FromInput !pl-[22px] !py-[6px] !border !border-BorderColor-15 !rounded-[5px] !w-0 flex-grow !text-xs !pr-[22px] h-7"
                        />
                      )}
                      {searchInputShow ? (
                        <>
                          <img
                            src={SearchIcon}
                            onClick={() => setSearchInputShow((prev) => !prev)}
                            className={`w-[14px] h-[14px] absolute top-1/2 -translate-y-1/2 left-[5px] cursor-pointer`}
                          />
                          <img
                            src={closeIcon}
                            onClick={()=>{
                              setSearchTerm("");
                              // setSearchInputShow((prev) =>!prev);
                            }}
                            className={`w-[14px] h-[14px] absolute top-1/2 -translate-y-1/2 right-[5px] cursor-pointer`}
                          />
                        </>
                      ) : (
                        <img
                          src={SearchIcon}
                          onClick={() => setSearchInputShow((prev) => !prev)}
                          className={`w-[14px] h-[14px] cursor-pointer`}
                        />
                      )}
                    </div>
                    <div className="relative" ref={filterRef}>
                      <button
                        onClick={toggleDropdown}
                        className="border border-BorderColor-15 rounded-[5px] h-7 w-7 flex justify-center items-center"
                      >
                        <img src={fillterIon} className="h18w18 m-auto" />
                      </button>
                      {isDropdownOpen && (
                        <div className="Dropdown FilterDropdown p-[10px] overflow-hidden">
                          <div className="flex flex-col pb-[10px] pt-[2px] mb-[10px] relative after:absolute after:bottom-0 after:left-[-10px] after:right-[-10px] after:w-[calc(100%+20px)] after:h-[1px] after:bg-BlackColor-15">
                            <label className="text-BlackColor-40 text-[10px] uppercase">
                              filters
                            </label>
                            <div className="DropdownItems relative">
                              <label htmlFor="sort-newest" className="text-sm">
                                All
                              </label>
                              <input
                                type="radio"
                                id="sort-newest"
                                value="newest"
                                checked={sortOption === "all"}
                                onChange={() => handleSortChange("all")}
                                className="custom-Radio-box"
                              />
                              <div className="RadioBox"></div>
                            </div>
                            <div className="DropdownItems relative">
                              <label htmlFor="sort-newest" className="text-sm">
                                Newest First
                              </label>
                              <input
                                type="radio"
                                id="sort-newest"
                                value="newest"
                                checked={sortOption === "newest"}
                                onChange={() => handleSortChange("newest")}
                                className="custom-Radio-box"
                              />
                              <div className="RadioBox"></div>
                            </div>
                            <div className="DropdownItems relative">
                              <label htmlFor="sort-oldest" className="text-sm">
                                Oldest First
                              </label>
                              <input
                                type="radio"
                                id="sort-oldest"
                                value="oldest"
                                checked={sortOption === "oldest"}
                                onChange={() => handleSortChange("oldest")}
                                className="custom-Radio-box"
                              />
                              <div className="RadioBox"></div>
                            </div>
                          </div>
                          <div
                            className="pt-[2px] pb-[10px] relative after:absolute after:bottom-0 after:left-[-10px] after:right-[-10px] after:w-[calc(100%+20px)] after:h-[1px] after:bg-BlackColor-15"
                            role="none"
                          >
                            <label className="text-BlackColor-40 text-[10px] uppercase">
                              stars
                            </label>
                            <button
                              onClick={() => setFilterType([])}
                              className="DropdownItems relative"
                            >
                              <div className=" text-sm">All</div>
                              <input
                                type="checkbox"
                                className="custom-Check-box"
                              />
                              <div className="CheckBox"></div>
                            </button>
                            {/* <div className="">
                              {Array.from({ length: 5 }, (_, i) => i + 1).map(
                                (star) => (
                                  <div
                                    key={star}
                                    className="DropdownItems relative"
                                  >
                                    <label
                                      htmlFor={`filter-${star}`}
                                      className="flex items-center text-sm gap-1"
                                    >
                                      {Array.from({ length: star }).map(
                                        (_, index) => (
                                          // <FaStar
                                          // className="text-[#FFCC80]"
                                          // key={index}
                                          // />
                                          <img
                                            src={OneRetingStar}
                                            className="h-[13] w-[13px]"
                                            alt="Star"
                                            key={index}
                                          />
                                        )
                                      )}
                                    </label>
                                    <input
                                      type="checkbox"
                                      id={`filter-${star}`}
                                      value={star}
                                      checked={filterType.includes(
                                        star.toString()
                                      )}
                                      onChange={handleFilterChange}
                                      className="custom-Check-box"
                                    />
                                    <div className="CheckBox"></div>
                                  </div>
                                )
                              )}
                            </div> */}
                           <div className="">
                              {Array.from({ length: 5 }, (_, i) => i + 1).map((star) => (
                                <div key={star} className="DropdownItems relative">
                                  <label htmlFor={`filter-${star}`} className="flex items-center text-sm gap-1">
                                    {Array.from({ length: 5 }).map((_, index) => (
                                      <>
                                      <img
                                        src={index < star ? `${OneRetingStar}`:`${StarBlack15}`}
                                        className={`h-[13px] w-[13px]`}
                                        alt="Star"
                                        key={index}
                                      />
                                      </>
                                    ))}
                                    <span className="ml-[2px]">{star}.0</span>
                                  </label>
                                  <input
                                    type="checkbox"
                                    id={`filter-${star}`}
                                    value={star}
                                    checked={filterType.includes(star.toString())}
                                    onChange={handleFilterChange}
                                    className="custom-Check-box z-[2]"
                                  />
                                  <div className="CheckBox"></div>
                                </div>
                              ))}
                            </div>
                          </div>
                          <button
                            onClick={applyFilters}
                            className="btn sign-in-btn py-[10px] text-[13px] mt-[10px]"
                          >
                            Apply Filters
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="RetingCardMain">
                  {ReviewDatas.length === 0 ? (
                    <div className=" flex-grow my-auto flex justify-center items-center absolute left-1/2 top-[calc(50%+70px)] -translate-x-2/4 -translate-y-2/4">
                      <div className="flex flex-col items-center gap-[20px]">
                        <img
                          src={NoDataFoundIcon}
                          className="h-[100px] w-[100px] object-contain"
                        />
                        <div className=" text-center text-sm text-BlackColor font-semibold">
                          No Data Found
                        </div>
                      </div>
                    </div>
                  ) : (
                    ReviewDatas.map((review, index) => (
                      <div className="RetingCard">
                        <div className="flex flex-col gap-1">
                          <div className=" flex items-center gap-[15px] justify-between">
                            <div className="flex gap-[12px] w-[calc(100%-45px)]">
                              <div className=" rounded-full h-8 w-8">
                                <img
                                  src={UserProfile}
                                  className=" object-cover h-full w-full"
                                />
                              </div>
                              <div className="flex flex-col w-[calc(100%-48px)]">
                                <div className=" flex item-center gap-2">
                                  <span className="text-sm font-semibold truncate max-w-[calc(100%-90px)] leading-[1]">
                                    {" "}
                                    {highlightText(review.name, searchTerm)}
                                  </span>
                                  <span className="text-xs text-BlackColor-40 flex items-center">
                                    . {formatDate(review.createdAt)}
                                  </span>
                                </div>
                                <div className=" flex items-center gap-[6px]">
                                  <div className=" flex items-center gap-1">
                                    {[...Array(Math.floor(review.rating))].map(
                                      (_, i) => (
                                        <img
                                          key={i}
                                          src={OneRetingStar}
                                          className="h-[13] w-[13px]"
                                          alt="Star"
                                        />
                                      )
                                    )}
                                    {review.rating % 1 !== 0 && (
                                      <img
                                        src={HalfRetingStar}
                                        className="h-[13] w-[13px]"
                                        alt="Half Star"
                                      />
                                    )}
                                  </div>
                                  <span className="font-semibold text-xs">
                                    {review.rating}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div
                              className="relative"
                              ref={(el) => (ActionRef.current[index] = el)}
                            >
                              <button className="h-[30px] w-[30px] rounded-md flex">
                                <img
                                  onClick={() =>
                                    handleActionDropdown(review.reviewId)
                                  }
                                  src={ThreeDots}
                                  className="m-auto"
                                />
                              </button>
                              {actionDropdownOpen == review.reviewId && (
                                <ul className="Dropdown !top-[30px] !right-[15px]">
                                  <li className="DropdownItems">
                                    <a
                                      onClick={() =>
                                        handleEditReview(review.reviewId)
                                      }
                                    >
                                      <div>Edit</div>
                                      <img src={EditIcon} className="h18w18" />
                                    </a>
                                  </li>
                                  <li className="DropdownItems">
                                    <a
                                      onClick={() =>
                                        openDeleteModal(review.reviewId)
                                      }
                                    >
                                      <div>Delete</div>
                                      <img
                                        src={DeleteIcon}
                                        className="h18w18"
                                      />
                                    </a>
                                  </li>
                                </ul>
                              )}
                            </div>
                            <DeleteConfirmation
                              isOpen={isModalOpen}
                              onClose={() => setModalOpen(false)}
                              onDelete={handleDeleteReview}
                            />
                          </div>
                        </div>
                        <div
                          className={`text-sm text-BlackColor relative ${
                            expandedReviewText[review.reviewId]
                              ? ""
                              : "line-clamp-3"
                          }`}
                          style={{ overflow: "hidden" }} // To hide overflow content
                        >
                          {/* <p>{highlightText(review.text, searchTerm)}</p> */}
                          {review.text
                            .split(/\n\n/)
                            .map((paragraph, i, arr) => (
                              <span
                                key={i}
                                className={` break-words ${
                                  i === arr.length - 1 ? "mb-0" : "block mb-2"
                                }`}
                              >
                                {highlightText(paragraph, searchTerm)}
                              </span>
                            ))}
                          {!expandedReviewText[review.reviewId] &&
                            review.text.split(" ").length > 20 && (
                              <a
                                className="cursor-pointer text-LinkedInBlue whitespace-nowrap font-medium absolute right-0 bottom-0"
                                onClick={() =>
                                  ExpandReviewText(review.reviewId)
                                }
                                style={{
                                  background: "white",
                                  paddingLeft: "4px",
                                }}
                              >
                                <span className="mr-1 text-sm text-BlackColor-60">
                                  ...
                                </span>
                                <span className="underline">Read more</span>
                              </a>
                            )}
                          {expandedReviewText[review.reviewId] && (
                            <a
                              className="cursor-pointer text-LinkedInBlue whitespace-nowrap font-medium"
                              onClick={() => ExpandReviewText(review.reviewId)}
                            >
                              <span className="underline !ml-1">Read less</span>
                            </a>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
                {/* Pagination statr   */}
                {sortedReviews.length > reviewsPerPage && (
                  <div className="bg-WhiteColor flex justify-center mx-[-20px] px-[20px] pt-[15px] mt-auto">
                    <nav aria-label="Pagination" className="w-full">
                      <ul className="inline-flex items-center space-x-[5px] justify-center w-full">
                        <li className=" flex items-center">
                          <button
                            // className={`PaginetionButton`}
                            className={`PaginetionButton ${
                              currentPage === 1 ? "disabled" : ""
                            }`}
                            onClick={handlePreviousPage}
                            disabled={currentPage === 1}
                          >
                            <img
                              src={DownArror}
                              className={` rotate-90 h-5 w-5`}
                            />
                          </button>
                        </li>
                        {/* <li>
                    <ul className="flex items-center space-x-3">
                       {[...Array(totalPages)].map((_, pageIndex) => (
                        <li key={pageIndex}>
                          <button
                            className={`PaginetionItems ${currentPage === pageIndex + 1 ? 'active' : ''}`}
                            onClick={() => handlePageClick(pageIndex + 1)}
                          >
                            {pageIndex + 1}
                          </button>
                        </li>
                      ))}
                    </ul>
                    </li> */}
                        <li className=" flex items-center">
                          <ul className="flex items-center space-x-[5px]">
                            {renderPaginationItems()}
                          </ul>
                        </li>

                        <li className=" flex items-center">
                          <button
                            // className={`PaginetionButton active`}
                            className={`PaginetionButton ${
                              currentPage === totalPages ? "disabled" : ""
                            }`}
                            onClick={handleNextPage}
                            disabled={currentPage === totalPages}
                          >
                            <img
                              src={DownArror}
                              className={` -rotate-90 h-5 w-5`}
                            />
                          </button>
                        </li>
                      </ul>
                    </nav>
                  </div>
                )}
                {/* Pagination End   */}
              </div>
              <div className="Footer">
                <button
                  title="Add New"
                  className="btn sign-in-btn"
                  onClick={handleShowReviewForm}
                >
                  Add Review
                </button>
              </div>
            </>
          )}

         {/*-------------- Render Review Form ---------------*/}
          {(isLinkedIn || editIndex !== null) && showReviewForm && (
            <>
              <AddReview
                handleCancel={handleCancel}
                editIndex={editIndex}
                linkedInUserName={linkedInUserName}
                linkedInUserId={linkedInUserId}
                reviews={reviews}
                setReviews={setReviews}
                setShowReviewForm={setShowReviewForm}
                setEditIndex={setEditIndex}
                newReview={newReview}
                setNewReview={setNewReview}
                setActionDropdownOpen={setActionDropdownOpen}
              />
            </>
          )}

         {/*-------------- To add a review, you need to be Open LinkedIn Profile ---------------*/}
          {!isLinkedIn && showReviewForm && editIndex === null && (
            <>
              <h1 className="text-2xl font-bold text-black mt-5">
                To add a review, you need to be Open LinkedIn Profile.
              </h1>
            </>
          )}
        </>
      )}
    </>
  );
}

export default Review;
