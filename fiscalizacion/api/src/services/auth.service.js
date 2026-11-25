import prisma from '../lib/prisma.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
export const registerUser = async (userData) => {
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    return prisma.user.create({
        data: {
            ...userData,
            password: hashedPassword,
        },
    });
};
export const loginUser = async (credentials) => {
    const user = await prisma.user.findUnique({
        where: { email: credentials.email },
    });
    if (!user) {
        throw new Error('Invalid credentials');
    }
    const isPasswordValid = await bcrypt.compare(credentials.password, user.password);
    if (!isPasswordValid) {
        throw new Error('Invalid credentials');
    }
    const token = jwt.sign({ userId: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });
    return { token };
};
//# sourceMappingURL=auth.service.js.map