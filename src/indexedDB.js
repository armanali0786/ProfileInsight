// indexedDB.js

const DB_NAME = "ReviewsDB";
const DB_VERSION = 2;
// const USER_TABLE = "users";
const LINKEDINUSERS_TABLE = "linkedinusers";
const LINKEDINUSERS_DETAILS = "linkedinusersdetails";
const REVIEW_TABLE = "reviews";
const BACKUP_TABLE = "reviewBackups";
let db;

/* --------------------------Initialize the database--------------------------------- */
const initDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = (event) => {
      console.error("Database error:", event);
      reject(event);
    };

    request.onsuccess = (event) => {
      db = event.target.result;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      db = event.target.result;

      console.log("Database of IDB", db)

      if (!db.objectStoreNames.contains(LINKEDINUSERS_TABLE)) {
        const userStore = db.createObjectStore(LINKEDINUSERS_TABLE, {
          keyPath: "contactId", 
        });
        userStore.createIndex("contactId", "contactId", { unique: true });
        userStore.createIndex("email", "email", { unique: true });
        userStore.createIndex("name", "name", { unique: false });
        userStore.createIndex("firstName", "given_name", { unique: false });
        userStore.createIndex("lastName", "family_name", { unique: false });
        userStore.createIndex("locale", "locale", { unique: false });
        userStore.createIndex("isVerified", "email_verified", { unique: false });
        userStore.createIndex("picture", "picture", { unique: false });
        userStore.createIndex("accountStatus", "account_status", {
          unique: false,
        });
      }

      if (!db.objectStoreNames.contains(REVIEW_TABLE)) {
        const reviewStore = db.createObjectStore(REVIEW_TABLE, {
          keyPath: "review_id", 
          autoIncrement: false, 
        });
        reviewStore.createIndex("contactId", "contactId", { unique: false });
        reviewStore.createIndex("reviewId", "review_id", { unique: false });
        reviewStore.createIndex("profileId", "profile_id", { unique: false });
        reviewStore.createIndex("reviewDescription", "review_description", { unique: false });
        reviewStore.createIndex("rating", "rating", { unique: false });
        reviewStore.createIndex("timestamp", "timestamp", { unique: false });
        reviewStore.createIndex("createdAt", "created_at", { unique: false });
        reviewStore.createIndex("updatedAt", "updated_at", { unique: false });
        reviewStore.createIndex("isAnon", "is_anon", { unique: false });
        reviewStore.createIndex("isLiked", "is_liked", { unique: false });
        reviewStore.createIndex("reviewerId", "reviewer_id", { unique: false });
        reviewStore.createIndex("reviewerFullName", "reviewer_fullname", { unique: false });
        reviewStore.createIndex("reviewerProfileImg", "reviewer_profile_img", { unique: false });
        reviewStore.createIndex("reviewerReviewCount", "reviewer_review_count", { unique: false });
        reviewStore.createIndex("taskName", "task_name", { unique: false });
        reviewStore.createIndex("comments", "comments", { unique: false }); 
      }
      
      if (!db.objectStoreNames.contains(BACKUP_TABLE)) {
        const backupStore = db.createObjectStore(BACKUP_TABLE, {
          keyPath: "reviewId",
          autoIncrement: true,
        });
        backupStore.createIndex("contactId", "contactId", { unique: false });
        backupStore.createIndex("action", "action", { unique: false });
        backupStore.createIndex("reviewId", "reviewId", { unique: false });
        backupStore.createIndex("timestamp", "timestamp", { unique: false });
        backupStore.createIndex("previousValues", "previousValues", {
          unique: false,
        });
      }

      if (!db.objectStoreNames.contains(LINKEDINUSERS_DETAILS)) {
        console.log("DB console inside", LINKEDINUSERS_DETAILS)
        const linkedinUserDetailsStore = db.createObjectStore(LINKEDINUSERS_DETAILS, {
          keyPath: "linkedInUserId",
        });
       linkedinUserDetailsStore.createIndex("linkedInUserId", "linkedInUserId", { unique: false });
       linkedinUserDetailsStore.createIndex("headline", "headline", { unique: false });
       linkedinUserDetailsStore.createIndex("location", "location", { unique: false });
       linkedinUserDetailsStore.createIndex("name", "name", { unique: false });
       linkedinUserDetailsStore.createIndex("profilePic", "profilePic", { unique: false });
       linkedinUserDetailsStore.createIndex("profileUrl", "profileUrl", { unique: false });
      }
    };
  });
};


// storeReviewsInDB.js

const storeReviewsInDB = async (reviews, profileId, contactId) => {
  console.log("All reviews of user based on profileId: ", reviews);
  try {
    const db = await initDB();
    const transaction = db.transaction([REVIEW_TABLE], "readwrite");
    const reviewStore = transaction.objectStore(REVIEW_TABLE);

    for (const review of reviews) {
      const reviewData = {
        ...review,
        reviewId: review.review_id, 
        comments: review.comments?.map((comment) => ({
          commentId: comment.comment_id,
          contactId: comment.reviewer_id,
          commentDescription: comment.comment_description,
          timestamp: comment.created_at,
          commenterName: comment.commenter_fullname,
          commenterProfileImg: comment.commenter_profile,
        })) || [],
      };

      const index = reviewStore.index("reviewerId");
      const existingReview = await new Promise((resolve, reject) => {
        const request = index.get(review.reviewer_id);
        request.onsuccess = () => resolve(request.result);
        request.onerror = (event) => reject(event.target.error);
      });
      if (existingReview) {
        if (existingReview.profile_id == profileId && existingReview.reviewer_id == contactId) {
          console.log(`Review ID ${review.review_id} already exists. Skipping.`);
          continue;
        }
        const updatedReview = { ...existingReview, ...reviewData };
        await new Promise((resolve, reject) => {
          const updateRequest = reviewStore.put(updatedReview);
          updateRequest.onsuccess = resolve;
          updateRequest.onerror = (event) => reject(event.target.error);
        });
        console.log(`Review ID ${review.review_id} updated successfully.`);
      } else {
        // Add the review if it doesn't already exist
        await new Promise((resolve, reject) => {
          const addRequest = reviewStore.add(reviewData);
          addRequest.onsuccess = resolve;
          addRequest.onerror = (event) => reject(event.target.error);
        });
        console.log(`New review ID ${review.review_id} added successfully.`);
      }
    }

    transaction.oncomplete = () => {
      console.log("Transaction completed successfully!");
    };

    transaction.onerror = (event) => {
      console.error("Transaction error:", event.target.error);
    };
  } catch (error) {
    console.error("Error in storeReviewsInDB:", error);
  }
};

// const storeReviewsInDB = async (reviews, profileId, contactId) => {
//   try {
//     const db = await initDB();
//     const transaction = db.transaction([REVIEW_TABLE], "readwrite");
//     const reviewStore = transaction.objectStore(REVIEW_TABLE);

//     // Step 1: Delete existing reviews based on profileId and contactId
//     const index = reviewStore.index("reviewerId");
//     const reviewsToDelete = await new Promise((resolve, reject) => {
//       const request = index.openCursor();
//       const reviewsToDelete = [];
//       request.onsuccess = (event) => {
//         const cursor = event.target.result;
//         console.log("cursor values:", cursor.value);
//         if (cursor) {
//           if (cursor.value.profile_id == profileId && cursor.value.reviewer_id == contactId) {
//             console.log(`Deleting existing review ID ${cursor.value}`);
//             reviewsToDelete.push(cursor.value);
//           }
//           cursor.continue();
//         } else {
//           resolve(reviewsToDelete);
//         }
//       };
//       request.onerror = (event) => reject(event.target.error);
//     });

//     // Delete the reviews that match the profileId and contactId
//     for (const review of reviewsToDelete) {
//       await new Promise((resolve, reject) => {
//         const deleteRequest = reviewStore.delete(review.reviewId);
//         deleteRequest.onsuccess = resolve;
//         deleteRequest.onerror = (event) => reject(event.target.error);
//       });
//       console.log(`Deleted existing review ID ${review.reviewId}.`);
//     }

//     // Step 2: Add or update the new reviews
//     for (const review of reviews) {
//       const reviewData = {
//         ...review,
//         reviewId: review.review_id, 
//         comments: review.comments?.map((comment) => ({
//           commentId: comment.comment_id,
//           contactId: comment.reviewer_id,
//           commentDescription: comment.comment_description,
//           timestamp: comment.created_at,
//           commenterName: comment.commenter_fullname,
//           commenterProfileImg: comment.commenter_profile,
//         })) || [],
//       };

//       const existingReview = await new Promise((resolve, reject) => {
//         const request = index.get(review.reviewer_id);
//         request.onsuccess = () => resolve(request.result);
//         request.onerror = (event) => reject(event.target.error);
//       });
//       if (existingReview) {
//         if (existingReview.profile_id == profileId && existingReview.reviewer_id == contactId) {
//           console.log(`Review ID ${review.review_id} already exists. Skipping.`);
//           continue;
//         }
//         const updatedReview = { ...existingReview, ...reviewData };
//         await new Promise((resolve, reject) => {
//           const updateRequest = reviewStore.put(updatedReview);
//           updateRequest.onsuccess = resolve;
//           updateRequest.onerror = (event) => reject(event.target.error);
//         });
//         console.log(`Review ID ${review.review_id} updated successfully.`);
//       } else {
//         // Add the review if it doesn't already exist
//         await new Promise((resolve, reject) => {
//           const addRequest = reviewStore.add(reviewData);
//           addRequest.onsuccess = resolve;
//           addRequest.onerror = (event) => reject(event.target.error);
//         });
//         console.log(`New review ID ${review.review_id} added successfully.`);
//       }
//     }

//     transaction.oncomplete = () => {
//       console.log("Transaction completed successfully!");
//     };

//     transaction.onerror = (event) => {
//       console.error("Transaction error:", event.target.error);
//     };
//   } catch (error) {
//     console.error("Error in storeReviewsInDB:", error);
//   }
// };



const storeLinkedInUsersDetails = async (userDetails, linkedInUserId) => {
  if (!linkedInUserId) {
    console.warn("Invalid linkedInUserId, skipping storage.");
    return;
  }

  const db = await initDB();
  const transaction = db.transaction([LINKEDINUSERS_DETAILS], "readwrite");
  const detailsStore = transaction.objectStore(LINKEDINUSERS_DETAILS);

  const usersDetailsData = {
    headline: userDetails.headline,
    location: userDetails.location,
    linkedInUserId: linkedInUserId,
    name: userDetails.name,
    profilePic: userDetails.profilePic,
    profileUrl: userDetails.profileUrl,
  };

  const userDetailsRequest = detailsStore.index('linkedInUserId').get(linkedInUserId);

  userDetailsRequest.onsuccess = () => {
    const existingData = userDetailsRequest.result;

    if (existingData) {
      // Compare the existing data with new data
      const isDataChanged = Object.keys(usersDetailsData).some(
        (key) => usersDetailsData[key] !== existingData[key]
      );

      if (!isDataChanged) {
        console.log("No changes detected, skipping update.");
      } else {
        // Update the data as it has changed
        const updateRequest = detailsStore.put(usersDetailsData);
        updateRequest.onsuccess = () => {
          console.log(`UserDetails for ${linkedInUserId} updated successfully!`);
        };
        updateRequest.onerror = (event) => {
          console.error("Error updating UserDetails:", event.target.error);
        };
      }
    } else {
      // Add new entry if it doesn't exist
      const addRequest = detailsStore.add(usersDetailsData);
      addRequest.onsuccess = () => {
        console.log(`UserDetails for ${linkedInUserId} added successfully!`);
      };
      addRequest.onerror = (event) => {
        console.error("Error adding UserDetails:", event.target.error);
      };
    }
  };

  userDetailsRequest.onerror = (event) => {
    console.error("Error checking UserDetails existence:", event.target.error);
  };

  transaction.onerror = (event) => {
    console.error("Transaction error:", event.target.error);
  };
};

const getUserDetailsByLinkedInId = async (linkedInUserId) => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(LINKEDINUSERS_DETAILS, "readonly");
    const objectStore = transaction.objectStore(LINKEDINUSERS_DETAILS);

    // Open cursor to loop through the object store
    const request = objectStore.index('linkedInUserId').get(linkedInUserId);

    request.onsuccess = (event) => {
      const result = event.target.result;
      if (result) {
        resolve(result);  // Found the user, resolve with data
      } else {
        resolve(null);  // User not found, resolve with null
      }
    };

    request.onerror = (error) => {
      reject("Error retrieving LinkedIn UserDetails: " + error.target.error);
    };
  });
};

/* --------------------------Add User Function--------------------------------- */
// const addLinkedInUser = (user) => {
//   console.log("User to Register: " , user);
//   return new Promise(async(resolve, reject) => {
//     // const existingUser = await getLinkedInUser(user.email)
//     // if (existingUser) {
//     //   reject("You already have an account.");
//     //   return;
//     // }
//     const transaction = db.transaction([LINKEDINUSERS_TABLE], "readwrite");
//     const store = transaction.objectStore(LINKEDINUSERS_TABLE);

//     const userData = {
//       contactId: user.contact_id,
//       email: user.email,
//       name: user.name,
//       given_name: user.given_name,
//       family_name: user.family_name,
//       locale: user.locale,
//       email_verified: user.email_verified,
//       picture: user.picture,
//       account_status: user.account_status,
//     };

//     const request = store.add(userData);
//     console.log("final response of backend to store user", request);
//     request.onsuccess = () => resolve(true);
//     request.onerror = (error) => reject(error);
//   });
// };
const addLinkedInUser = (user) => {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([LINKEDINUSERS_TABLE], "readwrite");
    const store = transaction.objectStore(LINKEDINUSERS_TABLE);

    // Check if user with the same contactId exists
    const getContactRequest = store.get(user.contact_id);
    getContactRequest.onsuccess = () => {
      if (getContactRequest.result) {
        console.warn("User already exists in IndexedDB:", getContactRequest.result);
        resolve(true); // Resolve without inserting
        return;
      }

      // Check if user with the same email exists
      const emailIndex = store.index("email");
      const getEmailRequest = emailIndex.get(user.email);
      getEmailRequest.onsuccess = () => {
        if (getEmailRequest.result) {
          console.warn("User with this email already exists:", getEmailRequest.result);
          resolve(true); // Resolve without inserting
          return;
        }

        // User does not exist, proceed with insertion
        const userData = {
          contactId: user.contact_id,
          email: user.email,
          name: user.name,
          given_name: user.given_name,
          family_name: user.family_name,
          locale: user.locale,
          email_verified: user.email_verified,
          picture: user.picture,
          account_status: user.account_status,
        };

        const addRequest = store.add(userData);
        console.log("Attempting to add user:", userData);
        addRequest.onsuccess = () => {
          console.log("User added to IndexedDB successfully.");
          resolve(true);
        };
        addRequest.onerror = (event) => {
          console.error("Error adding user to IndexedDB:", event);
          reject(event);
        };
      };

      getEmailRequest.onerror = (event) => {
        console.error("Error checking email in IndexedDB:", event);
        reject(event);
      };
    };

    getContactRequest.onerror = (event) => {
      console.error("Error checking contactId in IndexedDB:", event);
      reject(event);
    };
  });
};

/* --------------------------Register User to database--------------------------------- */
// const addUser = (user) => {
//   return new Promise(async (resolve, reject) => {
//     try {
//       const existingUser = await getUser(user.email); // Check if the email already exists
//       if (existingUser) {
//         reject("You already have an account.");
//         return;
//       }

//       const transaction = db.transaction([USER_TABLE], "readwrite");
//       const objectStore = transaction.objectStore(USER_TABLE);
//       const request = objectStore.add({ ...user, isVerified: false });

//       request.onsuccess = () => {
//         resolve();
//       };

//       request.onerror = (event) => {
//         reject("Error adding user: " + event.target.errorCode);
//       };
//     } catch (error) {
//       reject(error);
//     }
//   });
// };

/* --------------------------Retrieve User From database--------------------------------- */
// const getUser = (identifier) => {
//   return new Promise((resolve, reject) => {
//     const transaction = db.transaction([USER_TABLE], "readonly");
//     const objectStore = transaction.objectStore(USER_TABLE);
//     let request;

//     // Check if the identifier is a valid email or userId
//     if (identifier.includes("@")) {
//       request = objectStore.index("email").get(identifier); // Get user by email
//     } else if (!isNaN(identifier)) {
//       request = objectStore.get(Number(identifier)); // Get user by userId, ensure it's a number
//     } else {
//       reject("Invalid identifier");
//       return;
//     }

//     request.onsuccess = (event) => {
//       resolve(event.target.result);
//     };

//     request.onerror = (event) => {
//       reject("Error fetching user: " + event.target.errorCode);
//     };
//   });
// };

/* --------------------------Retrieve User From database--------------------------------- */
const getLinkedInUser = (identifier) => {
  console.log("Retrieving identifier to validate user", identifier);
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([LINKEDINUSERS_TABLE], "readonly");
    const objectStore = transaction.objectStore(LINKEDINUSERS_TABLE);
    let request;

    // Check if the identifier is a valid email or userId
    if (identifier.includes("@")) {
      // Query by email using the index
      request = objectStore.index("email").get(identifier);
    } else if (!isNaN(identifier)) {
      request = objectStore.get(Number(identifier)); // Query by userId
    } else {
      reject("Invalid identifier");
      return;
    }

    request.onsuccess = (event) => {
      console.log("result of validate user", event.target.result); // Check the result object here
      if (event.target.result) {
        resolve(event.target.result); // User found, resolve with result
      } else {
        resolve(null); // User not found, resolve with null
      }
    };

    request.onerror = (event) => {
      console.error("Error fetching user:", event.target.errorCode);
      reject("Error fetching user: " + event.target.errorCode);
    };
  });
};

/* -------------------------- Upate User to database--------------------------------- */
// const updateUser = async (userData) => {
//   // Ensure the database is initialized
//   if (!db) {
//     await initDB(); // Call initDB to initialize the database
//   }

//   const tx = db.transaction(USER_TABLE, "readwrite"); // Start a readwrite transaction
//   const store = tx.objectStore(USER_TABLE);

//   // Use the put method to update the user record
//   const request = store.put(userData); // userData should contain userId

//   return new Promise((resolve, reject) => {
//     request.onsuccess = () => {
//       resolve(request.result); // Successfully updated
//     };

//     request.onerror = () => {
//       reject(new Error("Failed to update user data")); // Handle error
//     };
//   });
// };

/* --------------------------  updateLinkedInUser to database--------------------------------- */
const updateLinkedInUser = async (userData) => {
  // Ensure the database is initialized
  if (!db) {
    await initDB(); // Call initDB to initialize the database
  }

  const tx = db.transaction(LINKEDINUSERS_TABLE, "readwrite"); // Start a readwrite transaction
  const store = tx.objectStore(LINKEDINUSERS_TABLE);

  // Use the put method to update the user record
  const request = store.put(userData); // userData should contain userId

  return new Promise((resolve, reject) => {
    request.onsuccess = () => {
      resolve(request.result); // Successfully updated
    };

    request.onerror = () => {
      reject(new Error("Failed to update user data")); // Handle error
    };
  });
};

/* -------------------------- Update User Password to database--------------------------------- */
// const updateUserPassword = (updatedUser) => {
//   // Your logic to update user password in IndexedDB
//   const transaction = db.transaction([USER_TABLE], "readwrite");
//   const objectStore = transaction.objectStore(USER_TABLE);
//   objectStore.put(updatedUser);
// };

/* -------------------------- Add Review to database--------------------------------- */
const addReview = async (reviewsData, setReviews) => {
  if (!reviewsData.review_id) {
    console.error("Error: reviewId is missing or undefined.");
    return;
  }

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([REVIEW_TABLE], "readwrite");
    const store = transaction.objectStore(REVIEW_TABLE);
    
    const reviewData = {
      ...reviewsData,
      reviewId: reviewsData.review_id,
      timestamp: Date.now(),
    };

    const request = store.add(reviewData);

    request.onsuccess = () => {
      setReviews((prevReviews) => [...prevReviews, reviewData]);
      resolve();
    };

    request.onerror = (event) => {
      console.error("Add review error:", event.target.errorCode);
      console.error("Error details:", event.target.error);
      reject("Error adding review: " + event.target.errorCode);
    };
  });
};


const addCommentToReview = (reviewId, updatedComment) => {
  const transaction = db.transaction([REVIEW_TABLE], "readwrite");
  const objectStore = transaction.objectStore(REVIEW_TABLE);

  const reviewIdNumeric = typeof reviewId === "string" ? parseInt(reviewId) : reviewId;

  const getAllRequest = objectStore.getAll();

  getAllRequest.onsuccess = (event) => {
    const allReviews = getAllRequest.result;
    const review = allReviews.find((review) => review.reviewId == reviewIdNumeric);
    if (review) {
      review.comments = review.comments || [];
      review.comments.push(updatedComment);
      const updateRequest = objectStore.put(review); 
      updateRequest.onsuccess = () => {
        console.log("Comment added to review successfully.");
      };
      updateRequest.onerror = (err) => {
        console.error("Error updating review with new comment:", err);
      };
    } else {
      console.error("Review not found in the database.");
    }
  };

  getAllRequest.onerror = (err) => {
    console.error("Error fetching review:", err);
  };
};

/* -------------------------- Update Review to database--------------------------------- */
const updateReview = async (reviewId, updatedData, setReviews) => {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([REVIEW_TABLE, BACKUP_TABLE], "readwrite");
    const objectStore = transaction.objectStore(REVIEW_TABLE);

    // const reviewIdNumeric = typeof reviewId === "string" ? parseInt(reviewId) : reviewId;

    const getAllRequest = objectStore.getAll();

    getAllRequest.onsuccess = () => {
      const allReviews = getAllRequest.result;

      // Find the review by reviewId
      const previousValues = allReviews.find((review) => review.reviewId == reviewId);

      if (previousValues) {
        const backupStore = transaction.objectStore(BACKUP_TABLE);
        const backupData = {
          contactId: previousValues.contactId,
          action: "update",
          previousValues: previousValues,
          timestamp: new Date().toISOString(),
        };

        backupStore.add(backupData).onsuccess = () => {
          const { reviewId, ...dataToUpdate } = updatedData;
          const updatedReview = { ...previousValues, ...dataToUpdate };

          const updateRequest = objectStore.put(updatedReview); 

          updateRequest.onsuccess = () => {
            console.log("Review updated successfully in IndexDB");
            // setReviews((prevReviews) =>
            //   prevReviews.map((r) =>
            //     r.reviewId == reviewId ? { ...r, ...updatedData } : r
            //   )
            // );
            resolve();
          };

          updateRequest.onerror = (event) => {
            console.error("Error updating review:", event.target.errorCode);
            reject("Error updating review: " + event.target.errorCode);
          };
        };

        backupStore.add(backupData).onerror = (event) => {
          console.error("Error backing up review:", event.target.errorCode);
          reject("Error backing up review: " + event.target.errorCode);
        };
      } else {
        reject("Review not found");
      }
    };

    getAllRequest.onerror = (event) => {
      console.error("Error fetching all reviews:", event.target.errorCode);
      reject("Error fetching all reviews: " + event.target.errorCode);
    };
  });
};

const updateCommentInReview = (reviewId, commentId, updatedComment) => {
  const transaction = db.transaction([REVIEW_TABLE], "readwrite");
  const objectStore = transaction.objectStore(REVIEW_TABLE);

  const reviewIdNumeric = typeof reviewId === "string" ? parseInt(reviewId) : reviewId;

  const getAllRequest = objectStore.getAll();

  getAllRequest.onsuccess = (event) => {
    const allReviews = getAllRequest.result;
    const review = allReviews.find((review) => review.reviewId == reviewIdNumeric);
    if (review) {
      // Ensure comments is an array, if not initialize it as an empty array
      if (!Array.isArray(review.comments)) {
        review.comments = [];
        console.log("Comments initialized as an empty array.");
      }

      // Check if the comment exists in the array
      const commentIndex = review.comments.findIndex((comment) => comment.comment_id == commentId);

      if (commentIndex !== -1) {
        // If the comment exists, update it
        review.comments[commentIndex].description = updatedComment.description;
        console.log("Comment updated successfully.");
      } else {
        // If the comment doesn't exist, add it to the array
        review.comments.push(updatedComment);
        console.log("Comment added successfully.");
      }

      // Now update the review with the updated comments array
      const updateRequest = objectStore.put(review);
      updateRequest.onsuccess = () => {
        console.log("Review updated with the new or updated comment.");
      };
      updateRequest.onerror = (err) => {
        console.error("Error updating review with new comment:", err);
      };
    } else {
      console.error("Review not found in the database.");
    }
  };

  getAllRequest.onerror = (err) => {
    console.error("Error fetching review:", err);
  };
};

/* -------------------------- Delete Review to database--------------------------------- */
const deleteReview = async (reviewId, setReviews) => {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([REVIEW_TABLE, BACKUP_TABLE], "readwrite");
    const objectStore = transaction.objectStore(REVIEW_TABLE);

    // const reviewIdNumeric = typeof reviewId == "string" ? Number(reviewId) : Number(reviewId);
    const reviewIdNumeric = String(reviewId); 

    // Create a backup first before deleting
    const backupStore = transaction.objectStore(BACKUP_TABLE);

    const getRequest = objectStore.get(reviewIdNumeric);

    getRequest.onsuccess = () => {
      const reviewToDelete = getRequest.result;

      if (reviewToDelete) {
        // Backup the review data before deletion
        const backupData = {
          contactId: reviewToDelete.contactId,
          action: "delete",
          previousValues: reviewToDelete,
          timestamp: new Date().toISOString(),
        };

        const addBackupRequest = backupStore.add(backupData);

        addBackupRequest.onsuccess = () => {
          // Now delete the review from the REVIEW_TABLE
          const deleteRequest = objectStore.delete(reviewIdNumeric);

          deleteRequest.onsuccess = () => {
            console.log("Review deleted successfully from REVIEW_TABLE");

            // Update the state to remove the deleted review from the UI
            setReviews((prevReviews) =>
              prevReviews.filter((r) => r.review_id != reviewIdNumeric)
            );

            resolve();  // Resolve the promise once everything is successful
          };

          deleteRequest.onerror = (event) => {
            console.error("Error deleting review:", event.target.errorCode);
            reject("Error deleting review: " + event.target.errorCode);
          };
        };

        addBackupRequest.onerror = (event) => {
          console.error("Error backing up review:", event.target.errorCode);
          reject("Error backing up review: " + event.target.errorCode);
        };
      } else {
        reject("Review not found");
      }
    };

    getRequest.onerror = (event) => {
      console.error("Error fetching review:", event.target.errorCode);
      reject("Error fetching review: " + event.target.errorCode);
    };
  });
};


const deleteCommentFromReview = (reviewId, commentId) => {
  const transaction = db.transaction([REVIEW_TABLE], "readwrite");
  const objectStore = transaction.objectStore(REVIEW_TABLE);

  const reviewIdNumeric = typeof reviewId === "string" ? parseInt(reviewId) : reviewId;

  const getAllRequest = objectStore.getAll();

  getAllRequest.onsuccess = (event) => {
    const allReviews = getAllRequest.result;
    const review = allReviews.find((review) => review.reviewId == reviewIdNumeric);
    if (review) {
      if (!Array.isArray(review.comments)) {
        review.comments = [];
        console.log("Comments initialized as an empty array.");
      }
      const commentIndex = review.comments.findIndex((comment) => comment.comment_id == commentId);

      if (commentIndex !== -1) {
        review.comments.splice(commentIndex, 1);
        console.log("Comment deleted successfully.");
      } else {
        console.error("Comment not found.");
      }

      const updateRequest = objectStore.put(review);
      updateRequest.onsuccess = () => {
        console.log("Review updated after comment deletion.");
      };
      updateRequest.onerror = (err) => {
        console.error("Error updating review after comment deletion:", err);
      };
    } else {
      console.error("Review not found in the database.");
    }
  };

  getAllRequest.onerror = (err) => {
    console.error("Error fetching review:", err);
  };
};

const getReviewsByLinkedInId = (linkedInId) => {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(REVIEW_TABLE, "readonly");
    const objectStore = transaction.objectStore(REVIEW_TABLE);
    const reviews = [];

    const request = objectStore.openCursor();

    request.onsuccess = (event) => {
      const cursor = event.target.result;
      if (cursor) {
        if (cursor.value.profile_id && cursor.value.profile_id === linkedInId) {
          reviews.push(cursor.value);
        }
        cursor.continue(); 
      } else {
        resolve(reviews); 
      }
    };

    request.onerror = (error) => {
      reject("Error retrieving reviews: " + error.target.error);
    };
  });
};

const getAllUsers = async () => {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([LINKEDINUSERS_TABLE], "readonly");
    const objectStore = transaction.objectStore(LINKEDINUSERS_TABLE);
    const request = objectStore.getAll();

    request.onsuccess = (event) => {
      // Resolve with the data
      resolve(event.target.result);
    };

    request.onerror = (event) => {
      reject("Error fetching users: " + event.target.errorCode);
    };
  });
};

const getAllReviews = async (database) => {
  return new Promise((resolve, reject) => {
    if (!database) {
      reject("Database is not initialized");
      return;
    }
    const transaction = database.transaction([REVIEW_TABLE], "readonly");
    const objectStore = transaction.objectStore(REVIEW_TABLE);
    const request = objectStore.getAll();

    request.onsuccess = (event) => {
      resolve(event.target.result);
    };

    request.onerror = (event) => {
      reject("Error fetching reviews: " + event.target.errorCode);
    };
  });
};

const getTotalReviews = async (database, contactId) => {
  return new Promise((resolve, reject) => {
    if (!database) {
      reject("Database is not initialized");
      return;
    }
    
    const transaction = database.transaction([REVIEW_TABLE], "readonly");
    const objectStore = transaction.objectStore(REVIEW_TABLE);
    const request = objectStore.getAll();  

    request.onsuccess = (event) => {
      const reviews = event.target.result;
      const filteredReviews = reviews.filter(review => review.contactId == contactId);
      resolve(filteredReviews);
    };

    request.onerror = (event) => {
      reject("Error fetching reviews: " + event.target.errorCode);
    };
  });
};


/* -------------------------- Function to fetch reviews by userId -------------------------------- */
const getReviewsByUserId = (contactId) => {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(REVIEW_TABLE, "readonly");
    const store = transaction.objectStore(REVIEW_TABLE);
    const index = store.index("contactId");
    const request = index.getAll(contactId); 
    request.onsuccess = (event) => {
      const reviews = event.target.result;
      resolve(reviews);
    };
    request.onerror = (event) => {
      console.error("Error fetching reviews:", event);
      reject(event);
    };
  });
};


const getLoginUserData = (contactId) => {
  return new Promise((resolve, reject) => {
    if (!db) {
      reject("Database is not initialized.");
      return;
    }
    const transaction = db.transaction([LINKEDINUSERS_TABLE], "readonly");
    const store = transaction.objectStore(LINKEDINUSERS_TABLE);
    const request = store.get(contactId); 

    request.onsuccess = (event) => {
      const user = event.target.result;
      if (user) {
        resolve(user);
      } else {
        reject("User not found.");
      }
    };
    request.onerror = (event) => {
      console.error("Error fetching user data:", event);
      reject(event.target.error);
    };
  });
};

export {
  initDB,
  addLinkedInUser,
  addReview,
  getReviewsByUserId,
  getReviewsByLinkedInId,
  updateReview,
  deleteReview,
  getAllUsers,
  getAllReviews,
  addCommentToReview,
  updateCommentInReview,
  deleteCommentFromReview,
  storeReviewsInDB,
  getTotalReviews,
  updateLinkedInUser,
  getLoginUserData,
  storeLinkedInUsersDetails,
  getUserDetailsByLinkedInId
};
