import React,{useState,useEffect} from 'react'

export default function Footer({ setIsCreatingAccount, isLoggedIn , isCreatingAccount}) {
  const [version, setVersion] = useState('');

  /*------------------  Retrive Version of Extension  ----------------------*/
  useEffect(() => {
    const manifestData = chrome.runtime.getManifest();
    setVersion(manifestData.version);
  }, []);

  return (
    <>
    { !isLoggedIn && !isCreatingAccount &&  (
      <>
      <div className="Footer">
        <span className="text-BlackColor-60">Don’t have an account?</span>
        <button
          onClick={() => {
            setIsCreatingAccount(true);
          }}
          className="text-BlackColor font-medium"
        >
          Sign Up
        </button>
      </div>
      <div className='text-center text-xs pb-[10px] text-BlackColor-60'>version {version}</div>
      </>
    )}
    </>
  );
}
