import React, { useRef, useEffect, useState } from "react";
import { FaEdit } from "react-icons/fa";
import { MdCancel } from "react-icons/md";
import AddUser from "../../assets/images/add-uesr.png";
import UserProfile from "../../assets/images/user-profile.png";
import ThreeDots from "../../assets/images/three-dots.png";
import OneRetingStar from "../../assets/images/one-star.png";
import HalfRetingStar from "../../assets/images/half-star.png";
import EditIcon from "../../assets/images/edit.png";
import closeIcon from "../../assets/images/close.png";
import DownArror from "../../assets/images/down-arror.png";
import AlertTriangle from "../../assets/images/alert-triangle.png";
import LinkedInLoader from "./LinkedInLoader";

interface Review {
  name: string;
  rating: number;
  text: string;
  reviewId: string; // Ensure reviewId is included in existingReview
}

interface LoaderProps {
  existingReview: any;
  errorMessage: any;
  handleEditReview: (reviewId: any) => void;
  handleCancel: () => void;
  loadingMessage: boolean;
  isLinkedIn: boolean;
  actionDropdownOpen?: any;
  expandedReviewText?: any;
  setExpandedReviewText?: any;
  ExpandReviewText?: any;
  setActionDropdownOpen?: any;
}

const Loader: React.FC<LoaderProps> = ({
  existingReview,
  errorMessage,
  handleEditReview,
  handleCancel,
  loadingMessage,
  isLinkedIn,
  actionDropdownOpen,
  expandedReviewText,
  ExpandReviewText,
  setActionDropdownOpen,
}) => {
  const ActionRef = useRef<HTMLDivElement | null>(null);
  const [actionDropdown, setActionDropdown] = useState<string | null>(null);

  /*-------------- format Date of Review --------------*/
  const formatDate = (dateString) => {
    return new Date(dateString)
      .toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
      .replace(/\./g, ""); // Removes any dots if they appear in the month abbreviation
  };

  /*-------------- Action dropdown hide, click Outside EventListener --------------*/
  const handleClickOutside = (event) => {
    if (ActionRef.current && !ActionRef.current.contains(event.target)) {
      setActionDropdown(null);
    }
  };
  useEffect(() => {
    if (actionDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [actionDropdown]);

  /*-------------- Handle action dropdown show based On specific review --------------*/
  const handleActionDropdown = (reviewId: string) => {
    setActionDropdown((prevId) => (prevId === reviewId ? null : reviewId));
    if (setActionDropdownOpen) {
      setActionDropdownOpen((prevId) =>
        prevId === reviewId ? null : reviewId
      );
    }
  };

  return (
    <>
     {/*--------------  Fetching Your data Message .. --------------*/}
      {!errorMessage && (
        <div className="ScrollableContent border-t border-BorderColor-15 relative gap-[80px] items-center justify-center">
          <div className="flex flex-col gap-5 my-auto justify-center items-center">
            <div className="loader m-auto"></div>
            <p className="text-sm text-center">
              Fetching Your data ...
            </p>
          </div>
        </div>
      )}

     {/*-------------- User Already Reviewed Profile --------------*/}
      {existingReview && (
        <>
          {/* <button>
              <img onClick={handleCancel} src={closeIcon} className="h18w18" />
            </button> */}
          <div className="ScrollableContent border-t border-BorderColor-15">
            <div className="RetingCardMain">
              <div className="RetingCard">
                <div className=" flex items-center gap-[15px] justify-between">
                  <div className="flex gap-[12px] w-[calc(100%-45px)]">
                    <div className="overflow-hidden rounded-full h-8 w-8">
                      <img
                        src={UserProfile}
                        className=" object-cover h-full w-full"
                      />
                    </div>
                    <div className=" flex flex-col w-[calc(100%-48px)]">
                      <div className=" flex item-center gap-2">
                        <span className="text-sm font-semibold truncate max-w-[calc(100%-90px)] leading-[1]">
                          {" "}
                          {existingReview.name}
                        </span>
                        <span className="text-xs text-BlackColor-40 flex items-center">
                          {formatDate(existingReview.createdAt)}
                        </span>
                      </div>
                      <div className=" flex items-center gap-[6px]">
                        <div className=" flex items-center gap-1">
                          {[...Array(Math.floor(existingReview.rating))].map(
                            (_, i) => (
                              <img
                                key={i}
                                src={OneRetingStar}
                                className="h-[13] w-[13px]"
                                alt="Star"
                              />
                            )
                          )}
                          {existingReview.rating % 1 !== 0 && (
                            <img
                              src={HalfRetingStar}
                              className="h-[13] w-[13px]"
                              alt="Half Star"
                            />
                          )}
                        </div>
                        <span className="font-semibold text-xs">
                          {existingReview.rating}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="relative" ref={ActionRef}>
                    <button className="h-[30px] w-[30px] rounded-md flex">
                      <img
                        onClick={() =>
                          handleActionDropdown(existingReview.reviewId)
                        }
                        src={ThreeDots}
                        className="m-auto"
                      />
                    </button>
                    {actionDropdown === existingReview.reviewId && (
                      <ul className="Dropdown !top-[30px] !right-[15px]">
                        <li className="DropdownItems">
                          <a
                            onClick={() =>
                              handleEditReview(existingReview.reviewId)
                            }
                          >
                            <div>Edit</div>
                            <img src={EditIcon} className="h18w18" />
                          </a>
                        </li>
                      </ul>
                    )}
                  </div>
                </div>
                <div
                  className={`text-sm text-BlackColor relative ${
                    expandedReviewText[existingReview.reviewId]
                      ? ""
                      : "line-clamp-3"
                  }`}
                  style={{ overflow: "hidden" }} // To hide overflow content
                >
                  {/* <p>{highlightText(existingReview.text, searchTerm)}</p> */}
                  {existingReview.text
                    .split(/\n\n/)
                    .map((paragraph, i, arr) => (
                      <span
                        key={i}
                        className={`break-words ${
                          i === arr.length - 1 ? "mb-0" : "block mb-2"
                        }`}
                      >
                        {existingReview.text}
                      </span>
                    ))}
                  {!expandedReviewText[existingReview.reviewId] &&
                    existingReview.text.split(" ").length > 20 && (
                      <a
                        className="cursor-pointer text-LinkedInBlue whitespace-nowrap font-medium absolute right-0 bottom-0"
                        onClick={() =>
                          ExpandReviewText(existingReview.reviewId)
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
                  {expandedReviewText[existingReview.reviewId] && (
                    <a
                      className="cursor-pointer text-LinkedInBlue whitespace-nowrap font-medium"
                      onClick={() => ExpandReviewText(existingReview.reviewId)}
                    >
                      <span className="underline !ml-1">Read less</span>
                    </a>
                  )}
                </div>
              </div>
              <div className="bg-[#FEF9C3] border border-[#FEF08A] rounded-[5px] text-[#854D0E] text-[13px] font-medium flex gap-[10px] p-[15px] mt-[30px]">
                <img src={AlertTriangle} className={`h-5 w-5`} />
                <span className=" break-words w-0 flex-grow">
                  {errorMessage}
                </span>
              </div>
            </div>
          </div>
          <button
            className="mt-auto btn w-full flex items-center justify-center gap-[10px]"
            onClick={handleCancel}
          >
            <img src={DownArror} className={` rotate-90 h-5 w-5`} />
            <span>back to reviews</span>
          </button>
        </>
      )}

     {/*-------------- User not on LinkedIn Page  LinkedInLoader --------------*/}
      {/* {!existingReview && !isLinkedIn && (
        <>
          {!loadingMessage && (
            <>
              <LinkedInLoader handleCancel={handleCancel} />
            </>
          )}
        </>
      )} */}
    </>
  );
};

export default Loader;
