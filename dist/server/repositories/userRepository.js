import prisma from "../prisma";
export const findUserByEmail = async (email) => {
    return await prisma.user.findUnique({
        where: { email },
        include: { company: true }
    });
};
export const createUser = async (data) => {
    return await prisma.user.create({
        data
    });
};
export const findUserById = async (id) => {
    return await prisma.user.findUnique({
        where: { id },
        include: { company: true }
    });
};
