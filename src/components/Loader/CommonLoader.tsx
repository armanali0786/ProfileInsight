import React from "react";



interface LoaderProps {

}

const CommonLoader: React.FC<LoaderProps> = ({
  
}) => {
 
  return (
    <>
     {/*--------------  Loader .. --------------*/}
        <div className="ScrollableContent border-t border-BorderColor-15 relative gap-[80px] items-center justify-center">
          <div className="flex flex-col gap-5 my-auto justify-center items-center">
            <div className="commonloader m-auto"></div>
          </div>
        </div>
    </>
  );
};

export default CommonLoader;
