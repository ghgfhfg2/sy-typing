import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { setUser } from "@redux/actions/user_action";
import { MdFavorite, MdFavoriteBorder } from "react-icons/md";
import { db } from "../firebase";
import {
  ref,
  get,
  set,
  update,
  runTransaction,
  onValue,
  off,
} from "firebase/database";
import { wordList } from "./db";
import { Button, Flex, Input, Spinner, useToast } from "@chakra-ui/react";
import { useDispatch, useSelector } from "react-redux";
import styled from "styled-components";
const MainContent = styled.div`
  padding: 0 1rem;
  height: calc(100vh - 60px);
`;

export default function Main() {
  const toast = useToast();
  const dispatch = useDispatch();
  const userInfo = useSelector((state) => state.user.currentUser);

  const {
    handleSubmit,
    setValue,
    getValues,
    register,
    formState: { errors, isSubmitting },
  } = useForm();

  const [showWord, setShowWord] = useState("");
  const [wordLeng, setWordLeng] = useState(0);
  useEffect(() => {
    get(ref(db, `wordLength`)).then((data) => {
      setWordLeng(data.val());
    });

    const iRef = ref(db, `wordIndex`);
    onValue(iRef, (data) => {
      const index = data.val();
      get(ref(db, `words/${index}`)).then((data) => {
        setShowWord(data.val());
      });
    });
    return () => {
      off(iRef);
    };
  }, []);

  const [timer, setTimer] = useState();
  const [count, setCount] = useState(0);
  const onTyping = (e) => {
    const val = e.target.value;
    const inputVal = e.nativeEvent.data;
    if (inputVal) {
      setCount((prev) => {
        return prev + 1;
      });
      if (!timer) {
        setTimer(new Date().getTime());
      }
    } else {
      setCount((prev) => {
        return prev - 1;
      });
    }
    if (!val) {
      setCount(0);
      setTimer("");
    }
  };

  const onSubmit = (e) => {
    const answer = e.answer;
    if (answer === showWord) {
      const lastTime = new Date().getTime();
      const distanceTime = lastTime - timer;
      const calcNum = Math.floor(60000 / distanceTime);
      const speed = calcNum * count;
      const ranIndex = Math.floor(Math.random() * wordLeng) + 1;
      const updates = {};
      updates[`wordIndex`] = ranIndex;
      update(ref(db), updates)
        .then(() => {
          setValue("answer", "");
          toast({
            position: "top",
            title: `입력성공! 타자속도 ${speed}타/분 입니다.`,
            status: "success",
            duration: 1000,
            isClosable: true,
          });
        })
        .then(() => {
          setCount(0);
          setTimer("");
        });
    } else {
      toast({
        position: "top",
        title: `정확하게 입력해 주세요.`,
        status: "error",
        duration: 1000,
        isClosable: true,
      });
    }
  };

  return (
    <MainContent>
      <div className="text_box">{showWord}</div>
      <form
        style={{ width: "100%", paddingTop: "20vh" }}
        onSubmit={handleSubmit(onSubmit)}
      >
        <Flex>
          <Input onInput={onTyping} type="text" {...register("answer")} />
        </Flex>
      </form>
    </MainContent>
  );
}
