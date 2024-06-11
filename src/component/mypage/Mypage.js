import { off, onValue, ref } from "firebase/database";
import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { db } from "../../firebase";
import { useToast } from "@chakra-ui/react";
import styled from "styled-components";
const MypageBox = styled.div`
  background: #fff;
  border-radius: 10px;
  padding: 1rem;
`;

export default function Mypage() {
  const toast = useToast();
  const userInfo = useSelector((state) => state.user.currentUser);
  useEffect(() => {}, [userInfo]);

  return <MypageBox></MypageBox>;
}
