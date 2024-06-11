import { useEffect } from "react";

const GoogleAd = () => {
  useEffect(() => {
    //production인 경우만 광고 요청
    //어차피 로컬에서는 광고가 표시되지 않는다
    if (process.env.NODE_ENV === "production")
      try {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
        console.log("Advertise is pushed");
      } catch (e) {
        console.error("AdvertiseError", e);
      }
  }, []);

  //production이 아닌 경우 대체 컴포넌트 표시
  if (process.env.NODE_ENV !== "production")
    return (
      <div
        style={{
          background: "#e9e9e9",
          color: "black",
          minHeight: "50px",
          fontSize: "18px",
          fontWeight: "bold",
          textAlign: "center",
          padding: "16px",
        }}
      ></div>
    );
  //production인 경우 구글 광고 표시
  return (
    <ins
      className="adsbygoogle"
      style={{
        display: "block",
        textAlign: "center",
        margin: "1.2rem 0",
      }}
      data-ad-layout="in-article"
      data-ad-format="fluid"
      data-ad-client="ca-pub-6788425959877259"
      data-ad-slot="5378971766"
    ></ins>
  );
};

export default GoogleAd;
