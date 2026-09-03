import bcrypt
import logging
from datetime import datetime, timedelta
from jose import jwt
import os
from dotenv import load_dotenv
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
import backend.models as models
from beanie import PydanticObjectId

load_dotenv()

SECRET_KEY = os.getenv("JWT_SECRET_KEY", "super-secret-development-key-change-me")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7 
logger = logging.getLogger(__name__)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Checks if a plain text password matches the hashed one."""
    # bcrypt requires strings to be encoded to bytes before checking
    return bcrypt.checkpw(
        plain_password.encode('utf-8'), 
        hashed_password.encode('utf-8')
    )

def get_password_hash(password: str) -> str:
    """Converts a plain text password into a secure hash using pure bcrypt."""
    # Force truncate to 72 characters and encode to bytes
    safe_password = password[:72].encode('utf-8')
    # Generate a secure salt and hash the password
    salt = bcrypt.gensalt()
    hashed_bytes = bcrypt.hashpw(safe_password, salt)
    # Decode back to a string so it can be saved in MongoDB
    return hashed_bytes.decode('utf-8')

def create_access_token(data: dict) -> str:
    """Generates a secure JSON Web Token for user sessions."""
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    
    # Creates the encrypted string
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

# This tells FastAPI where the frontend will send the login request
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/login")

async def get_current_user(token: str = Depends(oauth2_scheme)) -> models.User:
    """
    Intercepts the JWT token from the request headers, decodes it, 
    and fetches the matching user from MongoDB.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        # Decode the token using our secret key
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except jwt.JWTError:
        logger.warning("token_rejected reason=invalid_jwt")
        raise credentials_exception
        
    # Fetch the user from MongoDB Atlas using the ID from the token
    try:
        user = await models.User.get(PydanticObjectId(user_id))
    except (TypeError, ValueError):
        logger.warning("token_rejected reason=invalid_user_id")
        raise credentials_exception
    if user is None:
        logger.warning("token_rejected reason=user_not_found")
        raise credentials_exception
        
    return user