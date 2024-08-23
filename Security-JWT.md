# JWT
### What is JWT (JSON Web Token)?

**JWT (JSON Web Token)** is a compact, URL-safe means of representing claims between two parties. JWTs are often used for authentication and authorization purposes in web applications. They are self-contained tokens that include all the necessary information about the user, encoded as a JSON object, and are digitally signed.

### Structure of a JWT

A JWT typically consists of three parts:

1. **Header**: Contains metadata about the token, including the type of token (JWT) and the algorithm used to sign it (e.g., HS256).

   Example:

   ```json
   {
     "alg": "HS256",
     "typ": "JWT"
   }
   ```

2. **Payload**: Contains the claims, which are statements about the user and additional data. For example, user ID, roles, and expiration information.

   Example:

   ```json
   {
     "sub": "1234567890",
     "name": "John Doe",
     "admin": true,
     "exp": 1615132800
   }
   ```

3. **Signature**: Created by taking the encoded header, encoded payload, a secret key, and signing it using the specified algorithm. This ensures the integrity of the token.

A JWT might look like this:

```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwidXNlcklkIjoiMTIzNDU2IiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c
```

### How JWT is Used for Authentication

1. **User Sign-In**:

   - When a user logs in with valid credentials (like username and password), the server generates a JWT that includes the user’s details (like user ID) in the payload.
   - The server signs the JWT with a secret key and sends it back to the client.

2. **Storing JWT on the Client-Side**:

   - The client (usually a web application or mobile app) stores the JWT, typically in local storage or a cookie.

3. **Sending JWT with Requests**:

   - For subsequent requests to protected routes or resources, the client includes the JWT in the `Authorization` header using the `Bearer` schema:
     ```
     Authorization: Bearer <your_JWT_token>
     ```

4. **Server-Side JWT Verification**:
   - The server verifies the JWT on each request by checking its signature and ensuring the token hasn’t expired. If valid, the server allows access to the requested resources.

### Implementing JWT Authentication in Node.js

To integrate JWT authentication into your existing setup, you can follow these steps:

#### 1. Install Required Packages

You need to install `jsonwebtoken` for handling JWTs:

```bash
npm install jsonwebtoken
```

#### 2. Modify the `signIn` Service to Generate JWT

In your `procureService.js`, modify the `signIn` function to generate a JWT upon successful sign-in:

```javascript
import jwt from 'jsonwebtoken'

export const signIn = async data => {
  try {
    // Retrieve user by supplierID
    const userData = await databases.listDocuments(
      procureDatabaseId,
      procureSupplierTableId,
      [Query.equal('supplierID', data.supplierID)]
    )

    if (userData.documents.length !== 1) {
      return {
        status: false,
        message:
          'No account found. Check your supplier ID or password and try again.'
      }
    }

    const user = userData.documents[0]

    // Assuming password is hashed, compare it with bcrypt
    const passwordMatch = await bcrypt.compare(data.password, user.password)

    if (!passwordMatch || data.email !== user.email) {
      return {
        status: false,
        message: 'Invalid password. Please try again.'
      }
    }

    // Generate JWT Token
    const token = jwt.sign(
      {
        userId: user.supplierID,
        email: user.email
      },
      'your_secret_key', // Replace with your secret key
      { expiresIn: '1h' } // Token expiry time
    )

    // Successful sign-in
    return {
      status: true,
      message: 'Sign-in successful.',
      data: {
        user,
        token
      }
    }
  } catch (e) {
    console.log(e)
    return {
      status: false,
      message: `An error occurred. Please try again later or contact support: ${e}`,
      error: e.message
    }
  }
}
```

### 3. Modify the `procureController.js` to Return the JWT

In your `signIn` controller, ensure that the JWT is returned to the client:

```javascript
export const signIn = async (req, res, next) => {
  try {
    // Validate incoming request
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    // Call the signIn service with the request body
    const result = await procureService.signIn(req.body)

    if (!result.status) {
      return res.status(401).json({ message: result.message })
    }

    // Return success response with user data and JWT
    res.status(200).json({
      message: result.message,
      data: result.data.user,
      token: result.data.token // Return the JWT to the client
    })
  } catch (error) {
    next(error)
  }
}
```

### 4. Protect Routes Using JWT Middleware

To protect your routes, you can create a middleware function that checks for a valid JWT before allowing access:

```javascript
import jwt from 'jsonwebtoken'

export const authenticateJWT = (req, res, next) => {
  const token = req.header('Authorization')?.split(' ')[1]

  if (!token) {
    return res.status(403).json({ message: 'Access denied, token missing!' })
  }

  try {
    const decoded = jwt.verify(token, 'your_secret_key')
    req.user = decoded
    next()
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token!' })
  }
}
```

You would then use this middleware in your routes:

```javascript
router.get('/services', authenticateJWT, validateGetAllServices, getAllServices)
```

### 5. Client-Side Implementation

On the client side (in a browser or mobile app):

- Store the JWT in a secure place, such as `localStorage` or `sessionStorage`, or even in a secure cookie.
- Include the JWT in the `Authorization` header for requests to protected resources.

Example in JavaScript:

```javascript
const token = localStorage.getItem('token')
fetch('https://your-api.com/protected-route', {
  method: 'GET',
  headers: {
    Authorization: `Bearer ${token}`
  }
})
  .then(response => response.json())
  .then(data => console.log(data))
  .catch(error => console.error('Error:', error))
```

### Summary

JWTs are a popular method for handling authentication in web applications due to their stateless nature and security features. By integrating JWTs into your Node.js server, you can efficiently manage user sessions and protect routes from unauthorized access. Remember to secure your JWTs, especially by using HTTPS and properly managing token expiration and renewal.

# Usage on Client Side like ReactJS
You can use the JWT received from the server-side for accessing certain pages or features on the client side, such as in a React.js application. Here's how it typically works:

### 1. **JWT Flow Overview**

- **User Sign-In:** The user provides credentials (e.g., email and password) through a login form in your React app.
- **Server Authentication:** The credentials are sent to your server, which verifies them. If the credentials are correct, the server generates a JWT and sends it back to the client.
- **Client-Side Storage:** The React app stores the JWT, typically in `localStorage`, `sessionStorage`, or a secure cookie.
- **Protected Routes:** The React app uses the JWT to grant or deny access to certain pages or components (protected routes).
- **Authorization:** For any subsequent requests to protected API endpoints, the React app includes the JWT in the `Authorization` header to prove that the user is authenticated.

### 2. **Storing the JWT on the Client Side**

After successful login, store the JWT in a secure place:

```javascript
// Example after a successful sign-in
localStorage.setItem('token', token)
```

### 3. **Using JWT to Protect Routes in React**

You can use React Router to create protected routes that only render components if a valid JWT is present. Here's an example:

```javascript
import React from 'react'
import { Route, Redirect } from 'react-router-dom'

// A higher-order component to protect routes
const PrivateRoute = ({ component: Component, ...rest }) => {
  const isAuthenticated = !!localStorage.getItem('token') // Check if token exists

  return (
    <Route
      {...rest}
      render={props =>
        isAuthenticated ? <Component {...props} /> : <Redirect to='/login' />
      }
    />
  )
}

export default PrivateRoute
```

Now, you can use `PrivateRoute` to protect your components:

```javascript
import PrivateRoute from './PrivateRoute'
import Dashboard from './Dashboard'
import Login from './Login'

// Usage in React Router
;<Router>
  <Switch>
    <Route path='/login' component={Login} />
    <PrivateRoute path='/dashboard' component={Dashboard} />
  </Switch>
</Router>
```

### 4. **Including JWT in API Requests**

When making requests to your server for protected resources, include the JWT in the `Authorization` header:

```javascript
const token = localStorage.getItem('token')

fetch('https://your-api.com/protected-endpoint', {
  method: 'GET',
  headers: {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
})
  .then(response => response.json())
  .then(data => console.log(data))
  .catch(error => console.error('Error:', error))
```

### 5. **Handling Token Expiration**

JWTs typically have an expiration time. You should handle cases where the JWT has expired:

- **Automatic Logout:** You can check the token's expiration and automatically log the user out when it expires.
- **Token Renewal:** Implement a refresh token mechanism to obtain a new JWT without requiring the user to log in again.

### 6. **Security Considerations**

- **Storage:** Storing JWTs in `localStorage` or `sessionStorage` is convenient but can be susceptible to XSS (Cross-Site Scripting) attacks. Consider storing JWTs in secure, HttpOnly cookies if security is a major concern.
- **HTTPS:** Always use HTTPS to ensure that tokens are transmitted securely over the network.

### Summary

You can use the JWT generated by the server to control access to certain parts of your client-side application in React. This approach provides a seamless way to manage authentication and authorization, enabling you to protect routes and interact securely with your backend services.

# To Handle Token Expiration and Automatically Renew the Token When it has Expired
To handle token expiration and automatically renew the token when it has expired, you can implement a **refresh token** strategy. Here’s a step-by-step guide on how to do it:

### 1. **Understanding Access Tokens vs. Refresh Tokens**

- **Access Token**: A short-lived token used for authenticating requests. It typically has a short expiration time (e.g., 15 minutes to 1 hour).
- **Refresh Token**: A long-lived token used to obtain a new access token without requiring the user to re-authenticate. It typically has a longer expiration time (e.g., weeks or months).

### 2. **Server-Side: Generating and Managing Tokens**

On the server, when a user logs in:

- Generate both an access token and a refresh token.
- Store the refresh token securely on the server, possibly in a database, and associate it with the user.
- Send both tokens to the client.

Here’s an example using `jsonwebtoken` in Node.js:

```javascript
import jwt from 'jsonwebtoken'

// Generate Access Token
const generateAccessToken = user => {
  return jwt.sign({ userId: user.id, email: user.email }, 'access_secret', {
    expiresIn: '15m'
  })
}

// Generate Refresh Token
const generateRefreshToken = user => {
  return jwt.sign({ userId: user.id, email: user.email }, 'refresh_secret', {
    expiresIn: '7d'
  })
}

// Example during sign-in
export const signIn = async data => {
  // User authentication logic...
  const accessToken = generateAccessToken(user)
  const refreshToken = generateRefreshToken(user)

  // Save refreshToken to the database (for example, associated with the user)
  await saveRefreshTokenToDatabase(user.id, refreshToken)

  return {
    status: true,
    accessToken,
    refreshToken,
    message: 'Sign-in successful.'
  }
}
```

### 3. **Client-Side: Storing and Using Tokens**

After login, store both tokens:

```javascript
localStorage.setItem('accessToken', accessToken)
localStorage.setItem('refreshToken', refreshToken)
```

### 4. **Refreshing the Access Token**

When making API requests, if you detect that the access token has expired (usually from a 401 Unauthorized response), you can use the refresh token to get a new access token.

Here’s an example of how to handle this in a React application:

```javascript
const refreshAccessToken = async () => {
  const refreshToken = localStorage.getItem('refreshToken')

  try {
    const response = await fetch('https://your-api.com/token/refresh', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ token: refreshToken })
    })

    const data = await response.json()
    if (data.status === true) {
      localStorage.setItem('accessToken', data.accessToken)
      return data.accessToken
    } else {
      // Handle refresh token expiration (force user to log in again)
      localStorage.removeItem('accessToken')
      localStorage.removeItem('refreshToken')
      window.location.href = '/login'
    }
  } catch (error) {
    console.error('Error refreshing access token:', error)
  }
}

const apiRequest = async (url, options = {}) => {
  let token = localStorage.getItem('accessToken')

  if (!token) {
    token = await refreshAccessToken()
    if (!token) {
      throw new Error('Failed to refresh access token.')
    }
  }

  options.headers = {
    ...options.headers,
    Authorization: `Bearer ${token}`
  }

  const response = await fetch(url, options)

  if (response.status === 401) {
    // Token might be expired, try to refresh
    token = await refreshAccessToken()
    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`
      return fetch(url, options) // Retry the request with new token
    } else {
      throw new Error('Unauthorized')
    }
  }

  return response
}
```

### 5. **Server-Side: Endpoint to Refresh Token**

Create an endpoint on the server to handle the refresh token logic:

```javascript
export const refreshToken = async (req, res) => {
  const { token } = req.body

  if (!token) {
    return res
      .status(401)
      .json({ status: false, message: 'Refresh token required.' })
  }

  try {
    const user = jwt.verify(token, 'refresh_secret') // Verify refresh token

    // Check if refresh token is in the database
    const storedToken = await findRefreshTokenInDatabase(user.userId, token)

    if (!storedToken) {
      return res
        .status(403)
        .json({ status: false, message: 'Invalid refresh token.' })
    }

    // Generate a new access token
    const accessToken = generateAccessToken(user)

    return res.status(200).json({ status: true, accessToken })
  } catch (error) {
    return res
      .status(403)
      .json({ status: false, message: 'Invalid or expired refresh token.' })
  }
}
```

### 6. **Secure Token Management**

- **Rotate Refresh Tokens:** Every time you use a refresh token to get a new access token, you could issue a new refresh token and invalidate the old one.
- **Revoke Tokens:** Allow users to log out by deleting the refresh token from the server, rendering both the access and refresh tokens invalid.
- **Secure Storage:** Ensure tokens are stored securely. For access tokens, use `localStorage` or `sessionStorage`. For refresh tokens, consider using secure, HttpOnly cookies.

### Summary

By implementing a refresh token strategy, you can ensure that users remain authenticated without forcing them to log in repeatedly when their access token expires. This method improves user experience while maintaining security by ensuring tokens are renewed securely and efficiently.

# Case Where a User is Using Different Devices
When dealing with multiple devices, handling access tokens and refresh tokens requires careful consideration to ensure a seamless user experience across devices without compromising security. Here’s how you can approach this:

### 1. **Understanding the Issue**

If a user logs in from multiple devices, each device will receive its own access token and refresh token pair. The challenge arises when tokens are invalidated or refreshed on one device, potentially affecting the other devices:

- **Access Token Expiry:** If an access token expires, the device can use the refresh token to obtain a new one without affecting other devices.
- **Refresh Token Invalidation or Rotation:** If you implement a strategy where using the refresh token on one device invalidates it, then other devices might also lose the ability to refresh the token, forcing the user to log in again.

### 2. **Solutions to Manage Tokens Across Multiple Devices**

#### A. **Unique Refresh Tokens Per Device**

One approach is to issue a unique refresh token for each device. When the user logs in from a device:

1. **Generate Unique Tokens:** Generate a new access token and refresh token specific to that device.
2. **Store Device-Specific Tokens:** Store the refresh token with a unique identifier (e.g., device ID or user agent) in the database.
3. **Token Rotation:** When a refresh token is used on a device, you can either:
   - **Rotate Only That Device’s Token:** Rotate the refresh token for that specific device while keeping other devices’ tokens valid.
   - **Invalidate All Tokens (optional):** If security is a priority, you might choose to invalidate all refresh tokens for the user, forcing re-authentication across all devices. However, this might be inconvenient for users.

#### B. **Allow Multiple Active Tokens**

Allow each device to have its own active refresh token. This means:

- When a device refreshes its access token, only the refresh token for that device is rotated.
- Other devices continue using their own refresh tokens unaffected.

#### C. **Track and Manage Device Sessions**

You can track sessions for each device. Here’s how:

1. **Session Management:** Store a session for each device (including refresh token, IP address, user agent, and other metadata) in the database.
2. **Token Revocation:** Implement a mechanism to selectively revoke refresh tokens (e.g., during logout) for a specific device without affecting others.
3. **Session Expiry:** Set expiration times for each session, allowing tokens to naturally expire over time without requiring manual intervention.

### 3. **Implementing Multi-Device Support**

Here’s an example of how to implement multi-device token management:

#### A. **Server-Side: Generate and Store Tokens**

```javascript
import { v4 as uuidv4 } from 'uuid'

// Example during sign-in or token refresh
export const signIn = async (data, deviceInfo) => {
  // User authentication logic...

  // Generate device-specific refresh token
  const refreshToken = jwt.sign({ userId: user.id }, 'refresh_secret', {
    expiresIn: '7d'
  })

  // Store refresh token with device info
  const deviceId = uuidv4() // Unique ID for the device
  await saveRefreshTokenToDatabase(user.id, deviceId, refreshToken, deviceInfo)

  return {
    status: true,
    accessToken: generateAccessToken(user),
    refreshToken,
    message: 'Sign-in successful.'
  }
}
```

#### B. **Server-Side: Refresh Token Endpoint**

```javascript
export const refreshToken = async (req, res) => {
  const { token, deviceId } = req.body

  if (!token || !deviceId) {
    return res
      .status(401)
      .json({ status: false, message: 'Refresh token and device ID required.' })
  }

  try {
    const user = jwt.verify(token, 'refresh_secret') // Verify refresh token

    // Check if refresh token and device ID match in the database
    const storedToken = await findRefreshTokenInDatabase(
      user.userId,
      deviceId,
      token
    )

    if (!storedToken) {
      return res
        .status(403)
        .json({ status: false, message: 'Invalid refresh token.' })
    }

    // Rotate the refresh token for this device
    const newRefreshToken = jwt.sign(
      { userId: user.userId },
      'refresh_secret',
      { expiresIn: '7d' }
    )
    await updateRefreshTokenInDatabase(user.userId, deviceId, newRefreshToken)

    // Generate a new access token
    const accessToken = generateAccessToken(user)

    return res
      .status(200)
      .json({ status: true, accessToken, refreshToken: newRefreshToken })
  } catch (error) {
    return res
      .status(403)
      .json({ status: false, message: 'Invalid or expired refresh token.' })
  }
}
```

#### C. **Client-Side: Storing Device-Specific Tokens**

On the client side, store the device-specific refresh token and associated device ID:

```javascript
localStorage.setItem('accessToken', accessToken)
localStorage.setItem('refreshToken', refreshToken)
localStorage.setItem('deviceId', deviceId) // Store device ID
```

### 4. **Handling Logout Across Devices**

When the user logs out from a specific device, you can:

- Invalidate the refresh token for that device only, leaving other devices unaffected.
- Optionally, allow the user to log out from all devices by invalidating all refresh tokens associated with the user.

### 5. **Additional Security Measures**

- **IP and User-Agent Tracking:** Track and verify the IP address and user-agent with each request to detect anomalies.
- **Device Management UI:** Provide users with a dashboard where they can view and manage their active sessions/devices, allowing them to log out of specific devices.

### Summary

Handling tokens across multiple devices requires careful management of refresh tokens and sessions. By issuing device-specific refresh tokens and managing sessions server-side, you can allow users to maintain separate sessions on multiple devices while ensuring security. This approach enables seamless user experience across devices without forcing re-authentication unless absolutely necessary.

# Option C. Track and Manage Device Sessions
Tracking and managing device sessions is a robust way to handle multiple devices while maintaining control over security and user experience. Here’s a detailed guide on how to implement this approach:

### 1. **Overview**

In this approach, you will:

- Track each device session individually in the database.
- Store a unique session ID, along with the refresh token, IP address, and user agent for each device.
- Allow token rotation per device, ensuring that refreshing a token on one device doesn’t affect others.
- Provide mechanisms to revoke tokens or log out from specific devices.

### 2. **Database Schema for Device Sessions**

You'll need a table or collection to store session information for each device. Here’s an example schema:

- **User ID**: The ID of the user.
- **Session ID**: A unique identifier for each session (could be a UUID).
- **Refresh Token**: The refresh token for that session.
- **Device Info**: Information about the device (e.g., user agent, device type).
- **IP Address**: The IP address of the device when the session was created.
- **Expiration Date**: When the session expires (based on the refresh token's expiration).
- **Created At**: Timestamp of when the session was created.
- **Updated At**: Timestamp of the last token refresh.

### 3. **Server-Side Implementation**

#### A. **Sign-In and Session Creation**

When a user signs in, create a new session for the device:

```javascript
import { v4 as uuidv4 } from 'uuid'
import jwt from 'jsonwebtoken'

const generateAccessToken = user => {
  return jwt.sign({ userId: user.id, email: user.email }, 'access_secret', {
    expiresIn: '15m'
  })
}

const generateRefreshToken = () => {
  return jwt.sign({}, 'refresh_secret', { expiresIn: '7d' })
}

export const signIn = async (data, deviceInfo) => {
  // User authentication logic...

  const accessToken = generateAccessToken(user)
  const refreshToken = generateRefreshToken()
  const sessionId = uuidv4()

  // Save the session in the database
  await saveSessionToDatabase({
    userId: user.id,
    sessionId,
    refreshToken,
    deviceInfo,
    ipAddress: data.ipAddress, // From request metadata
    createdAt: new Date(),
    updatedAt: new Date()
  })

  return {
    status: true,
    accessToken,
    refreshToken,
    sessionId, // Return the session ID to the client
    message: 'Sign-in successful.'
  }
}
```

#### B. **Refreshing Tokens**

When a device requests a new access token, validate the session and refresh the tokens:

```javascript
export const refreshToken = async (req, res) => {
  const { refreshToken, sessionId } = req.body

  if (!refreshToken || !sessionId) {
    return res
      .status(401)
      .json({
        status: false,
        message: 'Refresh token and session ID required.'
      })
  }

  try {
    // Verify refresh token validity
    jwt.verify(refreshToken, 'refresh_secret')

    // Retrieve session from database
    const session = await findSessionBySessionId(sessionId)

    if (!session || session.refreshToken !== refreshToken) {
      return res
        .status(403)
        .json({ status: false, message: 'Invalid session or refresh token.' })
    }

    // Generate new tokens
    const newAccessToken = generateAccessToken({ userId: session.userId })
    const newRefreshToken = generateRefreshToken()

    // Update session with the new refresh token and updated timestamp
    await updateSessionInDatabase(sessionId, {
      refreshToken: newRefreshToken,
      updatedAt: new Date()
    })

    return res.status(200).json({
      status: true,
      accessToken: newAccessToken,
      refreshToken: newRefreshToken
    })
  } catch (error) {
    return res
      .status(403)
      .json({ status: false, message: 'Invalid or expired refresh token.' })
  }
}
```

#### C. **Logging Out and Session Revocation**

To log out from a specific device, delete or invalidate the session:

```javascript
export const logout = async (req, res) => {
  const { sessionId } = req.body

  try {
    await deleteSessionFromDatabase(sessionId)
    return res
      .status(200)
      .json({ status: true, message: 'Logged out successfully.' })
  } catch (error) {
    return res
      .status(500)
      .json({
        status: false,
        message: 'Error logging out. Please try again later.'
      })
  }
}
```

### 4. **Database Operations**

You'll need to implement the database operations for saving, retrieving, updating, and deleting sessions. Below are examples for a generic database interface (adjust according to your database system):

#### A. **Save Session to Database**

```javascript
async function saveSessionToDatabase(session) {
  // Example using a MongoDB-like interface
  return await db.collection('sessions').insertOne(session)
}
```

#### B. **Find Session by Session ID**

```javascript
async function findSessionBySessionId(sessionId) {
  // Example using a MongoDB-like interface
  return await db.collection('sessions').findOne({ sessionId })
}
```

#### C. **Update Session in Database**

```javascript
async function updateSessionInDatabase(sessionId, updates) {
  return await db
    .collection('sessions')
    .updateOne({ sessionId }, { $set: updates })
}
```

#### D. **Delete Session from Database**

```javascript
async function deleteSessionFromDatabase(sessionId) {
  return await db.collection('sessions').deleteOne({ sessionId })
}
```

### 5. **Client-Side Implementation**

On the client side (e.g., in a React application), you’ll need to handle storing the session ID, access token, and refresh token. Here’s how you can manage these:

#### A. **Store Session Data After Sign-In**

```javascript
const handleSignIn = async (email, password) => {
  const response = await fetch('/api/sign-in', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ email, password, deviceInfo: navigator.userAgent })
  })

  const data = await response.json()

  if (data.status) {
    localStorage.setItem('accessToken', data.accessToken)
    localStorage.setItem('refreshToken', data.refreshToken)
    localStorage.setItem('sessionId', data.sessionId) // Store session ID
  } else {
    // Handle sign-in error
    console.error(data.message)
  }
}
```

#### B. **Refreshing Tokens**

When making API requests, handle token expiration by refreshing tokens as needed:

```javascript
const refreshAccessToken = async () => {
  const refreshToken = localStorage.getItem('refreshToken')
  const sessionId = localStorage.getItem('sessionId')

  try {
    const response = await fetch('/api/refresh-token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ refreshToken, sessionId })
    })

    const data = await response.json()
    if (data.status) {
      localStorage.setItem('accessToken', data.accessToken)
      localStorage.setItem('refreshToken', data.refreshToken)
      return data.accessToken
    } else {
      // Handle refresh token expiration or invalidation
      logoutUser()
    }
  } catch (error) {
    console.error('Error refreshing access token:', error)
  }
}

const apiRequest = async (url, options = {}) => {
  let token = localStorage.getItem('accessToken')

  if (!token) {
    token = await refreshAccessToken()
    if (!token) {
      throw new Error('Failed to refresh access token.')
    }
  }

  options.headers = {
    ...options.headers,
    Authorization: `Bearer ${token}`
  }

  const response = await fetch(url, options)

  if (response.status === 401) {
    // Access token might be expired, try to refresh
    token = await refreshAccessToken()
    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`
      return fetch(url, options) // Retry the request with the new token
    } else {
      throw new Error('Unauthorized')
    }
  }

  return response
}
```

#### C. **Logout Implementation**

To log out from a specific device:

```javascript
const logoutUser = async () => {
  const sessionId = localStorage.getItem('sessionId')

  if (sessionId) {
    await fetch('/api/logout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ sessionId })
    })

    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('sessionId')
    window.location.href = '/login' // Redirect to login page
  }
}
```

### 6. **Session Management UI (Optional)**

You can build a UI in your application to let users manage their active sessions:

- **Display Active Sessions**: Fetch and display a list of the user’s active sessions (e.g., device type, IP address, last activity).
- **Allow Logout from Specific Devices**: Provide a button or link to log out from specific devices, which would delete the corresponding session.

```javascript
const fetchActiveSessions = async () => {
  const response = await fetch('/api/user-sessions', {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${localStorage.getItem('accessToken')}`
    }
  })

  const data = await response.json()
  return data.sessions
}

const handleSessionLogout = async sessionId => {
  await fetch('/api/logout', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${localStorage.getItem('accessToken')}`
    },
    body: JSON.stringify({ sessionId })
  })

  // Update UI after session is logged out
  const sessions = await fetchActiveSessions()
  updateSessionsUI(sessions)
}
```

### 7. **Security Considerations**

- **Session Expiration**: Ensure that sessions have a reasonable expiration time and are automatically cleaned up after expiration.
- **IP and User-Agent Matching**: Optionally, match IP addresses and user agents to further validate session integrity during each request.
- **Secure Storage**: Consider storing session IDs and tokens in a secure, HttpOnly cookie if security is a high priority.

### Summary

By tracking and managing device sessions, you can offer a seamless multi-device experience while maintaining security. Each device gets its own session, allowing for individual token management and the ability to log out from specific devices without affecting others. This method is flexible and scalable, making it suitable for applications where users frequently switch devices to access the same application.
