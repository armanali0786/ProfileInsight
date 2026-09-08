import React from 'react'
import LinkedinIcon from '../../assets/images/linkedin-icon.png';
import LinkedInLoaderIcon from '../../assets/images/linkedIn-loader-img.png';
import DownArror from "../../assets/images/down-arror.png";
import { useNavigate } from 'react-router-dom';

export default function LinkedInLoader({handleCancel}) {
  const navigate = useNavigate();
  return (
    <>
      <div className='ScrollableContent border-t border-BorderColor-15 relative gap-[80px] items-center justify-center'>
        <div className=' flex flex-col gap-[30px]'>
          <img src={LinkedInLoaderIcon} className='w-[150px] object-contain mx-auto' />
          <div className=' text-center text-sm text-BlackColor-60'>You’re on the wrong page—go to LinkedIn Profile</div>
          <button className="linkedin-btn btn" onClick={() => window.open('https://www.linkedin.com/', '_blank', 'noopener,noreferrer')}>
            <span>https://www.linkedin.com/</span>
            <img src={LinkedinIcon} />
          </button>
          <button
            className="mt-auto btn w-full flex items-center justify-center gap-[10px]"
            onClick={handleCancel}
          >
            <img src={DownArror} className={` rotate-90 h-5 w-5`} />
            <span>back to reviews</span>
          </button>
        </div>
        {/* <div className='loader'></div> */}
      </div>
    </>
  )
}
