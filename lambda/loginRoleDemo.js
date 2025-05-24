const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;

// hardcoded users สำหรับ demo (คุณจะเปลี่ยนไปใช้ DynamoDB หรือ Cognito ก็ได้ภายหลัง)
const demoUsers = {
  admin: { username: 'admin', password: 'admin', role: 'admin' },
  creator: { username: 'creator', password: 'creator', role: 'creator' },
  advisor: { username: 'advisor', password: 'advisor', role: 'advisor' },
};

exports.handler = async (event) => {
  try {
    const body = JSON.parse(event.body);
    const { username, password } = body;

    if (!username || !password) {
      return response(400, { message: 'Username and password are required' });
    }

    const user = demoUsers[username];

    if (!user || user.password !== password) {
      return response(401, { message: 'Invalid username or password' });
    }

    const token = jwt.sign(
      {
        userId: user.username,
        name: user.role,
        role: user.role,
      },
      JWT_SECRET,
      { expiresIn: '2h' }
    );

    return response(200, { token });

  } catch (err) {
    console.error('Login error:', err);
    return response(500, { message: 'Internal server error' });
  }
};

function response(statusCode, body) {
  return {
    statusCode,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': '*',
    },
    body: JSON.stringify(body),
  };
}
