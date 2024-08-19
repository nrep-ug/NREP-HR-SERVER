const users = [
    { id: 'user1', password: 'password123' },
    // Add more users as needed
];
export const userSignin = async (data) => {
    const user = users.find(u => u.id === data.userID && u.password === data.password);
    if (user) {
        return { success: true };
    } else {
        return { success: false, message: 'Invalid credentials' };
    }
};

//TODO: Real login functionality to be implemented