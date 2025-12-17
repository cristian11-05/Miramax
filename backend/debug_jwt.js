
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const { sign } = jwt;

console.log('Testing JWT Sign...');
try {
    const payload = { id: 1, username: 'admin', role: 'admin' };
    const secret = process.env.JWT_SECRET || 'secret';
    console.log('Secret used:', secret);

    const token = sign(payload, secret, { expiresIn: '24h' });
    console.log('Token generated successfully:', token);
} catch (error) {
    console.error('Error generate token:', error);
}
