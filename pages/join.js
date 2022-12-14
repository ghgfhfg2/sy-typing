import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setUser, clearUser } from "@redux/actions/user_action";
import { useRouter } from "next/router";
import { useForm } from "react-hook-form";
import {
  FormErrorMessage,
  FormControl,
  Input,
  Button,
  Flex,
} from "@chakra-ui/react";
import Link from "next/link";
import { db } from "src/firebase";
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
import { ref, set } from "firebase/database";
import { format } from "date-fns";
import LoginLayout from "@component/LoginLayout";

function Join() {
  const dispatch = useDispatch();
  const router = useRouter();
  const auth = getAuth();
  const {
    handleSubmit,
    register,
    formState: { errors, isSubmitting },
  } = useForm();

  const onSubmit = (values) => {
    return new Promise((resolve) => {
      createUserWithEmailAndPassword(auth, values.email, values.password)
        .then((userCredential) => {
          // Signed in
          delete values["password"];
          delete values["password2"];
          const user = userCredential.user;
          set(ref(db, `user/${user.uid}`), {
            ...values,
            uid: user.uid,
            date: format(new Date(), "yyyy-MM-dd HH:mm:ss"),
            timestamp: new Date().getTime(),
          });
          window.sessionStorage.setItem("isLogin", true);
        })
        .then((res) => {
          dispatch(setUser(user));
          router.push("/");
        })
        .catch((error) => {
          const errorCode = error.code;
          const errorMessage = error.message;
          if (errorCode === "auth/email-already-in-use") {
          }
          if (errorCode === "auth/too-many-requests") {
          }

          resolve();
        });
    });
  };

  return (
    <>
      <form
        style={{ width: "100vw", paddingTop: "20vh" }}
        onSubmit={handleSubmit(onSubmit)}
      >
        <Flex justifyContent="center" marginTop={10}>
          <Flex
            maxWidth={400}
            width="100%"
            flexDirection="column"
            alignItems="center"
            gap={2}
          >
            <FormControl isInvalid={errors.name}>
              <Input
                id="name"
                placeholder="* ??????"
                {...register("name", {
                  required: "????????? ???????????? ?????????.",
                })}
              />
              <FormErrorMessage>
                {errors.name && errors.name.message}
              </FormErrorMessage>
            </FormControl>
            <FormControl isInvalid={errors.email}>
              <Input
                id="email"
                placeholder="* ?????????"
                {...register("email", {
                  required: "???????????? ???????????? ?????????.",
                  pattern: /^\S+@\S+$/i,
                })}
              />
              <FormErrorMessage>
                {errors.email &&
                  errors.email.type === "required" &&
                  errors.email.message}
                {errors.email && errors.email.type === "pattern" && (
                  <>????????? ????????? ?????? ????????????.</>
                )}
              </FormErrorMessage>
            </FormControl>
            <FormControl isInvalid={errors.password}>
              <Input
                id="password"
                type="password"
                placeholder="* ????????????"
                {...register("password", {
                  required: true,
                  minLength: 6,
                  maxLength: 16,
                })}
              />
              <FormErrorMessage>
                {errors.password && errors.password.type === "required" && (
                  <>??????????????? ????????? ?????????</>
                )}
                {errors.password && errors.password.type === "minLength" && (
                  <>??????????????? ?????? 6?????? ?????? ????????? ?????????.</>
                )}
                {errors.password && errors.password.type === "maxLength" && (
                  <>??????????????? ?????? 16?????? ?????? ????????? ?????????.</>
                )}
              </FormErrorMessage>
            </FormControl>
            <FormControl isInvalid={errors.password2}>
              <Input
                id="password2"
                type="password"
                placeholder="* ??????????????????"
                {...register("password2", {
                  required: true,
                  validate: (value) => value === password.value,
                })}
              />
              <FormErrorMessage>
                {errors.password2 && errors.password2.type === "required" && (
                  <>???????????? ????????? ????????? ?????????</>
                )}
                {errors.password2 && errors.password2.type === "validate" && (
                  <>??????????????? ???????????? ????????????.</>
                )}
              </FormErrorMessage>
            </FormControl>
            <FormControl isInvalid={errors.call}>
              <Input
                id="call"
                type="number"
                placeholder="????????????"
                {...register("call", {
                  required: "??????????????? ???????????? ?????????.",
                })}
              />
            </FormControl>
            <Flex
              mt={4}
              width="100%"
              flexDirection="column"
              justifyContent="center"
            >
              <Button
                mb={2}
                width="100%"
                colorScheme="teal"
                isLoading={isSubmitting}
                type="submit"
              >
                ????????????
                {isSubmitting}
              </Button>
              <Link href="/login" align-self="flex-end">
                <a style={{ alignSelf: "flex-end" }}>?????????</a>
              </Link>
            </Flex>
          </Flex>
        </Flex>
      </form>
    </>
  );
}

export default Join;

Join.getLayout = function getLayout(page) {
  return <LoginLayout>{page}</LoginLayout>;
};
