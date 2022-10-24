import { useEffect, useState } from "react";
import { setUser } from "@redux/actions/user_action";
import { MdFavorite, MdFavoriteBorder } from "react-icons/md";
import { db } from "../firebase";
import {
  ref,
  set,
  update,
  runTransaction,
  onValue,
  off,
} from "firebase/database";
import { dbData, tagList } from "./db";
import { Button, Flex, Spinner, useToast } from "@chakra-ui/react";
import { useDispatch, useSelector } from "react-redux";
import { EmoticonList } from "@component/CommonStyled";

export default function Main() {
  const toast = useToast();
  const dispatch = useDispatch();
  const userInfo = useSelector((state) => state.user.currentUser);

  const [type, setType] = useState();
  const typeSort = (type) => {
    setType(type);
  };

  const [emoticonList, setEmoticonList] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  useEffect(() => {
    let arr = [];
    setIsLoading(true);
    const getEmoList = new Promise((resolve) => {
      arr = dbData.map((el) => {
        if (userInfo && userInfo?.favor.includes(el.uid)) {
          el.favor = 1;
        } else {
          el.favor = 0;
        }
        return el;
      });
      if (type) {
        arr = arr.filter((el) => el.tag === type);
      }
      setTimeout(() => {
        resolve(arr);
      }, 100);
    });
    getEmoList.then((res) => {
      setIsLoading(false);
      setEmoticonList(res);
    });
  }, [userInfo, type]);

  const onCopy = (el) => {
    navigator.clipboard.writeText(el.emo);
    toast({
      description: `${el.emo} 가 복사 되었습니다.`,
      status: "success",
      duration: 1000,
      isClosable: false,
    });
  };

  const onFavor = (el) => {
    const fRef = ref(db, `user/${userInfo.uid}/favor`);
    let newFavor;
    runTransaction(fRef, (pre) => {
      if (pre) {
        newFavor = [...pre];
        if (pre.find((list) => list === el.uid)) {
          newFavor = newFavor.filter((e) => e !== el.uid);
          toast({
            description: `${el.emo} 즐찾 취소 되었습니다.`,
            status: "success",
            duration: 1000,
            isClosable: false,
          });
        } else {
          newFavor = [...pre, el.uid];
          toast({
            description: `${el.emo} 즐찾 추가 되었습니다.`,
            status: "success",
            duration: 1000,
            isClosable: false,
          });
        }
      } else {
        newFavor = [el.uid];
        toast({
          description: `${el.emo} 즐찾 추가 되었습니다.`,
          status: "success",
          duration: 1000,
          isClosable: false,
        });
      }
      let newUser = { ...userInfo };
      newUser.favor = newFavor;
      dispatch(setUser(newUser));
      return newFavor;
    });
  };

  return (
    <div className="content_box">
      <Flex justifyContent="center" mb={5}>
        {tagList && (
          <>
            <Button
              onClick={() => typeSort("")}
              margin={1}
              colorScheme="blue"
              variant={type === "" ? "solid" : "outline"}
            >
              전체
            </Button>
            {tagList.map((el, idx) => (
              <>
                <Button
                  onClick={() => typeSort(el)}
                  margin={1}
                  colorScheme="blue"
                  variant={type === el ? "solid" : "outline"}
                >
                  {el}
                </Button>
              </>
            ))}
          </>
        )}
      </Flex>
      {isLoading ? (
        <>
          <Flex justifyContent="center" alignItems="center">
            <Spinner />
          </Flex>
        </>
      ) : (
        <EmoticonList>
          {emoticonList &&
            emoticonList.map((el) => (
              <li key={el.uid}>
                <button
                  type="button"
                  className="btn_emo"
                  onClick={() => onCopy(el)}
                >
                  {el.emo}
                </button>
                <button
                  type="button"
                  className="btn_favor"
                  onClick={() => onFavor(el)}
                >
                  {el.favor ? <MdFavorite /> : <MdFavoriteBorder />}
                </button>
              </li>
            ))}
        </EmoticonList>
      )}
    </div>
  );
}
