import prisma from "../prisma.js";

export const findUserByEmail = async (email: string) => {
  return await prisma.user.findUnique({
    where: { email },
    include: { company: true }
  });
};

export const createUser = async (data: any) => {
  return await prisma.user.create({
    data
  });
};

export const findUserById = async (id: number) => {
  return await prisma.user.findUnique({
    where: { id },
    include: { company: true }
  });
};

