import React,{useEffect, useState} from 'react'
import Stars from '../assets/images/stars.png';
import { useNavigate } from 'react-router-dom';

export default function GetStartedPage({}) {
  const [version, setVersion] = useState('');
  const navigate = useNavigate();

  /*-------------- Retrieve Version of Extension --------------*/
  useEffect(() => {
    const manifestData = chrome.runtime.getManifest();
    setVersion(manifestData.version);
  }, []);

  return (
    <>
    <div className="ScrollableContent !max-h-[calc(100vh-62px)]">
      <div className=' flex flex-col relative my-auto gap-[80px]'>
        {/* title Content start */}
        <div className="flex flex-col gap-[20px]">
          <h1 className=" text-[44px] text-BlackColor font-semibold text-center capitalize leading-tight">Simply Review Your Network</h1>
        </div>
        <div className=' flex flex-col gap-[40px]'>
          <div className=' flex flex-col gap-2'>
            <div className=' text-BlackColor text-[20px] font-semibold text-center capitalize'>Sign up to continue</div>
            <div className='text-light-blue text-xs text-center leading-[1.5]'>Simple steps to get through then you will be able <br/>to continue to Revil.app</div>
          </div>
        {/* SIGN IN button start  */}
        <button
          type="submit"
          className="w-full sign-in-btn btn flex items-center justify-center gap-2"
          onClick={() => navigate('/signup')}
        >
          <img src={Stars} className='w-5' />
          <span>Register Now</span>
        </button>
        </div>
        {/* SIGN IN button end  */}
        {/* title Content end  */}
        {/* <img src={FiveStar} className=' absolute top-[73%] w-28' /> */}
      </div>
    </div>
      {/* <div className="Footer">
        <span className="text-BlackColor-60">Don’t have an account?</span>
        <button
           onClick={() => navigate('/signup')}
          className="text-BlackColor font-medium"
        >
          Sign Up
        </button>
      </div> */}
      {/* <div className=' text-center text-xs pb-[10px] text-BlackColor-60'>version {version}</div> */}
    </>
  )
}
