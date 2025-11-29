from fastapi import FastAPI, APIRouter, HTTPException, Header, status
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timedelta
from passlib.context import CryptContext
import jwt
from bson import ObjectId
import httpx

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# JWT settings
JWT_SECRET = os.environ.get('JWT_SECRET', 'your-secret-key')
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24 * 30  # 30 days

# YouTube API key
YOUTUBE_API_KEY = os.environ.get('YOUTUBE_API_KEY')

# Helper functions
def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(hours=JWT_EXPIRATION_HOURS)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALGORITHM)
    return encoded_jwt

def verify_token(token: str) -> dict:
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except jwt.JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def get_current_user(authorization: Optional[str] = Header(None)):
    if not authorization:
        raise HTTPException(status_code=401, detail="Authorization header missing")
    
    try:
        token = authorization.replace("Bearer ", "")
        payload = verify_token(token)
        user_id = payload.get("user_id")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token payload")
        
        user = await db.users.find_one({"_id": ObjectId(user_id)})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        
        user["_id"] = str(user["_id"])
        return user
    except Exception as e:
        raise HTTPException(status_code=401, detail=str(e))

# Pydantic Models

class UserRegister(BaseModel):
    username: str
    email: EmailStr
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: str
    username: str
    email: str
    profilePic: Optional[str] = None
    avatarUrl: Optional[str] = None
    isPublic: bool = True
    currentCourtId: Optional[str] = None

class UserUpdate(BaseModel):
    username: Optional[str] = None
    profilePic: Optional[str] = None
    avatarUrl: Optional[str] = None

class CourtResponse(BaseModel):
    id: str
    name: str
    address: str
    latitude: float
    longitude: float
    hours: str
    phoneNumber: str
    rating: float
    currentPlayers: int
    image: Optional[str] = None

class MessageSend(BaseModel):
    toUserId: str
    message: str

class MessageResponse(BaseModel):
    id: str
    fromUserId: str
    toUserId: str
    message: str
    timestamp: datetime
    read: bool

class ConversationResponse(BaseModel):
    userId: str
    username: str
    profilePic: Optional[str]
    lastMessage: str
    timestamp: datetime
    unreadCount: int

class FriendRequest(BaseModel):
    toUserId: str

class FriendRequestResponse(BaseModel):
    status: str
    message: str

# Initialize Houston courts data
async def initialize_courts():
    count = await db.courts.count_documents({})
    if count == 0:
        # Nationwide basketball courts covering all 50 US states
        nationwide_courts = [
            # TEXAS - Houston
            {
                "name": "Discovery Green Court",
                "address": "1500 McKinney St, Houston, TX 77010",
                "latitude": 29.7514,
                "longitude": -95.3585,
                "hours": "6:00 am - 10:00 pm",
                "phoneNumber": "713-400-7336",
                "rating": 4.5,
                "currentPlayers": 0,
                "averagePlayers": 18,
                "publicUsersAtCourt": [],
                "image": None
            },
            {
                "name": "Levy Park Courts",
                "address": "3801 Eastside St, Houston, TX 77098",
                "latitude": 29.7368,
                "longitude": -95.3979,
                "hours": "7:00 am - 9:00 pm",
                "phoneNumber": "713-526-7867",
                "rating": 4.8,
                "currentPlayers": 0,
                "averagePlayers": 22,
                "publicUsersAtCourt": [],
                "image": None
            },
            {
                "name": "Memorial Park Courts",
                "address": "6501 Memorial Dr, Houston, TX 77007",
                "latitude": 29.7652,
                "longitude": -95.4294,
                "hours": "5:00 am - 11:00 pm",
                "phoneNumber": "713-863-8403",
                "rating": 4.6,
                "currentPlayers": 0,
                "averagePlayers": 15,
                "publicUsersAtCourt": [],
                "image": None
            },
            {
                "name": "Market Square Park Court",
                "address": "301 Milam St, Houston, TX 77002",
                "latitude": 29.7621,
                "longitude": -95.3617,
                "hours": "6:00 am - 10:00 pm",
                "phoneNumber": "713-650-3022",
                "rating": 4.3,
                "currentPlayers": 0,
                "averagePlayers": 12,
                "publicUsersAtCourt": [],
                "image": None
            },
            {
                "name": "Hermann Park Courts",
                "address": "6001 Fannin St, Houston, TX 77030",
                "latitude": 29.7177,
                "longitude": -95.3905,
                "hours": "6:00 am - 9:00 pm",
                "phoneNumber": "713-526-2183",
                "rating": 4.7,
                "currentPlayers": 0,
                "averagePlayers": 20,
                "publicUsersAtCourt": [],
                "image": None
            },
            {
                "name": "Buffalo Bayou Park Courts",
                "address": "3000 Allen Pkwy, Houston, TX 77019",
                "latitude": 29.7589,
                "longitude": -95.3897,
                "hours": "5:00 am - 10:00 pm",
                "phoneNumber": "713-752-0314",
                "rating": 4.4,
                "currentPlayers": 0,
                "averagePlayers": 14,
                "publicUsersAtCourt": [],
                "image": None
            },
            {
                "name": "Spotts Park Courts",
                "address": "401 Spotts Park Dr, Houston, TX 77009",
                "latitude": 29.7856,
                "longitude": -95.3498,
                "hours": "7:00 am - 9:00 pm",
                "phoneNumber": "713-845-1000",
                "rating": 4.2,
                "currentPlayers": 0,
                "averagePlayers": 10,
                "publicUsersAtCourt": [],
                "image": None
            },
            {
                "name": "MacGregor Park Courts",
                "address": "5225 Calhoun Rd, Houston, TX 77021",
                "latitude": 29.7112,
                "longitude": -95.3544,
                "hours": "6:00 am - 10:00 pm",
                "phoneNumber": "713-747-7234",
                "rating": 4.1,
                "currentPlayers": 0,
                "averagePlayers": 8,
                "publicUsersAtCourt": [],
                "image": None
            },
            # LA Fitness Locations
            {
                "name": "LA Fitness - Galleria",
                "address": "5155 West Alabama St, Houston, TX 77056",
                "latitude": 29.7355,
                "longitude": -95.4620,
                "hours": "5:00 am - 11:00 pm",
                "phoneNumber": "713-621-1100",
                "rating": 4.6,
                "currentPlayers": 0,
                "averagePlayers": 24,
                "publicUsersAtCourt": [],
                "image": None
            },
            {
                "name": "LA Fitness - Midtown",
                "address": "3232 Roseland St, Houston, TX 77004",
                "latitude": 29.7311,
                "longitude": -95.3686,
                "hours": "5:00 am - 11:00 pm",
                "phoneNumber": "713-520-1100",
                "rating": 4.5,
                "currentPlayers": 0,
                "averagePlayers": 26,
                "publicUsersAtCourt": [],
                "image": None
            },
            {
                "name": "LA Fitness - Memorial City",
                "address": "9603 Katy Fwy, Houston, TX 77024",
                "latitude": 29.7821,
                "longitude": -95.5381,
                "hours": "5:00 am - 11:00 pm",
                "phoneNumber": "713-461-1100",
                "rating": 4.7,
                "currentPlayers": 0,
                "averagePlayers": 28,
                "publicUsersAtCourt": [],
                "image": None
            },
            {
                "name": "LA Fitness - Westheimer",
                "address": "12655 Westheimer Rd, Houston, TX 77077",
                "latitude": 29.7357,
                "longitude": -95.6278,
                "hours": "5:00 am - 11:00 pm",
                "phoneNumber": "281-496-1100",
                "rating": 4.5,
                "currentPlayers": 0,
                "averagePlayers": 22,
                "publicUsersAtCourt": [],
                "image": None
            },
            {
                "name": "LA Fitness - Sugar Land",
                "address": "16730 Creek Bend Dr, Sugar Land, TX 77478",
                "latitude": 29.5959,
                "longitude": -95.6354,
                "hours": "5:00 am - 11:00 pm",
                "phoneNumber": "281-277-1100",
                "rating": 4.6,
                "currentPlayers": 0,
                "averagePlayers": 20,
                "publicUsersAtCourt": [],
                "image": None
            },
            # Premium Gyms (Alphaland-style)
            {
                "name": "Life Time Athletic - Houston",
                "address": "5425 West Loop S, Bellaire, TX 77401",
                "latitude": 29.7048,
                "longitude": -95.4893,
                "hours": "4:00 am - 12:00 am",
                "phoneNumber": "713-667-9355",
                "rating": 4.8,
                "currentPlayers": 0,
                "averagePlayers": 30,
                "publicUsersAtCourt": [],
                "image": None
            },
            {
                "name": "Houstonian Club",
                "address": "111 North Post Oak Ln, Houston, TX 77024",
                "latitude": 29.7672,
                "longitude": -95.4618,
                "hours": "5:00 am - 10:00 pm",
                "phoneNumber": "713-680-2626",
                "rating": 4.9,
                "currentPlayers": 0,
                "averagePlayers": 16,
                "publicUsersAtCourt": [],
                "image": None
            },
            {
                "name": "Fitness Connection - Westheimer",
                "address": "13359 Westheimer Rd, Houston, TX 77077",
                "latitude": 29.7358,
                "longitude": -95.6489,
                "hours": "24 hours",
                "phoneNumber": "281-496-2000",
                "rating": 4.4,
                "currentPlayers": 0,
                "averagePlayers": 25,
                "publicUsersAtCourt": [],
                "image": None
            },
            {
                "name": "Equinox - River Oaks",
                "address": "1900 West Gray St, Houston, TX 77019",
                "latitude": 29.7498,
                "longitude": -95.3987,
                "hours": "5:00 am - 10:00 pm",
                "phoneNumber": "713-807-8200",
                "rating": 4.7,
                "currentPlayers": 0,
                "averagePlayers": 18,
                "publicUsersAtCourt": [],
                "image": None
            },
            {
                "name": "24 Hour Fitness - Greenway Plaza",
                "address": "3663 Richmond Ave, Houston, TX 77046",
                "latitude": 29.7345,
                "longitude": -95.4418,
                "hours": "24 hours",
                "phoneNumber": "713-621-2424",
                "rating": 4.3,
                "currentPlayers": 0,
                "averagePlayers": 21,
                "publicUsersAtCourt": [],
                "image": None
            },
            {
                "name": "Gold's Gym - Galleria",
                "address": "5005 Woodway Dr, Houston, TX 77056",
                "latitude": 29.7496,
                "longitude": -95.4628,
                "hours": "5:00 am - 11:00 pm",
                "phoneNumber": "713-961-0020",
                "rating": 4.5,
                "currentPlayers": 0,
                "averagePlayers": 19,
                "publicUsersAtCourt": [],
                "image": None
            }
        ]
        await db.courts.insert_many(nationwide_courts)
        logging.info("Initialized nationwide basketball courts database")

# Authentication Routes
@api_router.post("/auth/register")
async def register(user: UserRegister):
    # Check if user exists
    existing_user = await db.users.find_one({"email": user.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    existing_username = await db.users.find_one({"username": user.username})
    if existing_username:
        raise HTTPException(status_code=400, detail="Username already taken")
    
    # Create new user
    user_dict = {
        "username": user.username,
        "email": user.email,
        "password": hash_password(user.password),
        "profilePic": None,
        "isPublic": True,
        "currentCourtId": None,
        "createdAt": datetime.utcnow()
    }
    
    result = await db.users.insert_one(user_dict)
    user_id = str(result.inserted_id)
    
    # Create token
    token = create_access_token({"user_id": user_id})
    
    return {
        "token": token,
        "user": {
            "id": user_id,
            "username": user.username,
            "email": user.email,
            "profilePic": None,
            "avatarUrl": None,
            "isPublic": True,
            "currentCourtId": None
        }
    }

@api_router.post("/auth/login")
async def login(credentials: UserLogin):
    user = await db.users.find_one({"email": credentials.email})
    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    if not verify_password(credentials.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    user_id = str(user["_id"])
    token = create_access_token({"user_id": user_id})
    
    return {
        "token": token,
        "user": {
            "id": user_id,
            "username": user["username"],
            "email": user["email"],
            "profilePic": user.get("profilePic"),
            "avatarUrl": user.get("avatarUrl"),
            "isPublic": user.get("isPublic", True),
            "currentCourtId": str(user["currentCourtId"]) if user.get("currentCourtId") else None
        }
    }

@api_router.get("/auth/me")
async def get_me(authorization: Optional[str] = Header(None)):
    user = await get_current_user(authorization)
    return {
        "id": user["_id"],
        "username": user["username"],
        "email": user["email"],
        "profilePic": user.get("profilePic"),
        "avatarUrl": user.get("avatarUrl"),
        "isPublic": user.get("isPublic", True),
        "currentCourtId": user.get("currentCourtId")
    }

# User Routes
@api_router.get("/users")
async def get_users(authorization: Optional[str] = Header(None)):
    current_user = await get_current_user(authorization)
    users = await db.users.find({"_id": {"$ne": ObjectId(current_user["_id"])}}).to_list(1000)
    
    return [{
        "id": str(user["_id"]),
        "username": user["username"],
        "profilePic": user.get("profilePic")
    } for user in users]

@api_router.put("/users/profile")
async def update_profile(update: UserUpdate, authorization: Optional[str] = Header(None)):
    user = await get_current_user(authorization)
    
    update_data = {}
    if update.username:
        update_data["username"] = update.username
    if update.profilePic:
        update_data["profilePic"] = update.profilePic
    if update.avatarUrl:
        update_data["avatarUrl"] = update.avatarUrl
        update_data["profilePic"] = update.avatarUrl  # Use avatarUrl as profilePic for display
    
    if update_data:
        await db.users.update_one(
            {"_id": ObjectId(user["_id"])},
            {"$set": update_data}
        )
    
    updated_user = await db.users.find_one({"_id": ObjectId(user["_id"])})
    return {
        "id": str(updated_user["_id"]),
        "username": updated_user["username"],
        "email": updated_user["email"],
        "profilePic": updated_user.get("profilePic"),
        "avatarUrl": updated_user.get("avatarUrl"),
        "isPublic": updated_user.get("isPublic", True),
        "currentCourtId": str(updated_user["currentCourtId"]) if updated_user.get("currentCourtId") else None
    }

@api_router.put("/users/toggle-privacy")
async def toggle_privacy(authorization: Optional[str] = Header(None)):
    user = await get_current_user(authorization)
    current_public = user.get("isPublic", True)
    new_public = not current_public
    
    # Update user privacy
    await db.users.update_one(
        {"_id": ObjectId(user["_id"])},
        {"$set": {"isPublic": new_public}}
    )
    
    # If user is currently at a court and switching to private, remove from court count
    if user.get("currentCourtId") and not new_public:
        await db.courts.update_one(
            {"_id": ObjectId(user["currentCourtId"])},
            {
                "$pull": {"publicUsersAtCourt": user["_id"]},
                "$inc": {"currentPlayers": -1}
            }
        )
    elif user.get("currentCourtId") and new_public:
        # If switching to public and at a court, add to count
        await db.courts.update_one(
            {"_id": ObjectId(user["currentCourtId"])},
            {
                "$addToSet": {"publicUsersAtCourt": user["_id"]},
                "$inc": {"currentPlayers": 1}
            }
        )
    
    return {"isPublic": new_public}

# Court Routes
@api_router.get("/courts")
async def get_courts():
    courts = await db.courts.find().to_list(1000)
    return [{
        "id": str(court["_id"]),
        "name": court["name"],
        "address": court["address"],
        "latitude": court["latitude"],
        "longitude": court["longitude"],
        "hours": court["hours"],
        "phoneNumber": court["phoneNumber"],
        "rating": court["rating"],
        "currentPlayers": court.get("currentPlayers", 0),
        "averagePlayers": court.get("averagePlayers", 12),
        "image": court.get("image")
    } for court in courts]

@api_router.get("/courts/{court_id}")
async def get_court(court_id: str):
    try:
        court = await db.courts.find_one({"_id": ObjectId(court_id)})
        if not court:
            raise HTTPException(status_code=404, detail="Court not found")
        
        return {
            "id": str(court["_id"]),
            "name": court["name"],
            "address": court["address"],
            "latitude": court["latitude"],
            "longitude": court["longitude"],
            "hours": court["hours"],
            "phoneNumber": court["phoneNumber"],
            "rating": court["rating"],
            "currentPlayers": court.get("currentPlayers", 0),
            "averagePlayers": court.get("averagePlayers", 12),
            "image": court.get("image")
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@api_router.post("/courts/{court_id}/checkin")
async def checkin_court(court_id: str, authorization: Optional[str] = Header(None)):
    user = await get_current_user(authorization)
    
    # Check out from current court if any
    if user.get("currentCourtId"):
        await checkout_court(user["currentCourtId"], authorization)
    
    # Check in to new court
    court = await db.courts.find_one({"_id": ObjectId(court_id)})
    if not court:
        raise HTTPException(status_code=404, detail="Court not found")
    
    # Update user's current court
    await db.users.update_one(
        {"_id": ObjectId(user["_id"])},
        {"$set": {"currentCourtId": ObjectId(court_id)}}
    )
    
    # If user is public, update court player count
    if user.get("isPublic", True):
        await db.courts.update_one(
            {"_id": ObjectId(court_id)},
            {
                "$addToSet": {"publicUsersAtCourt": user["_id"]},
                "$inc": {"currentPlayers": 1}
            }
        )
    
    updated_court = await db.courts.find_one({"_id": ObjectId(court_id)})
    return {
        "message": "Checked in successfully",
        "currentPlayers": updated_court.get("currentPlayers", 0)
    }

@api_router.post("/courts/{court_id}/checkout")
async def checkout_court(court_id: str, authorization: Optional[str] = Header(None)):
    user = await get_current_user(authorization)
    
    # Update user's current court to None
    await db.users.update_one(
        {"_id": ObjectId(user["_id"])},
        {"$set": {"currentCourtId": None}}
    )
    
    # If user is public, decrease court player count
    if user.get("isPublic", True):
        await db.courts.update_one(
            {"_id": ObjectId(court_id)},
            {
                "$pull": {"publicUsersAtCourt": user["_id"]},
                "$inc": {"currentPlayers": -1}
            }
        )
        
        # Ensure player count doesn't go below 0
        await db.courts.update_one(
            {"_id": ObjectId(court_id), "currentPlayers": {"$lt": 0}},
            {"$set": {"currentPlayers": 0}}
        )
    
    updated_court = await db.courts.find_one({"_id": ObjectId(court_id)})
    return {
        "message": "Checked out successfully",
        "currentPlayers": updated_court.get("currentPlayers", 0) if updated_court else 0
    }

# Message Routes
@api_router.get("/messages/conversations")
async def get_conversations(authorization: Optional[str] = Header(None)):
    user = await get_current_user(authorization)
    user_id = ObjectId(user["_id"])
    
    # Get all messages involving this user
    messages = await db.messages.find({
        "$or": [
            {"fromUserId": user_id},
            {"toUserId": user_id}
        ]
    }).sort("timestamp", -1).to_list(1000)
    
    # Group by conversation
    conversations = {}
    for msg in messages:
        other_user_id = msg["toUserId"] if msg["fromUserId"] == user_id else msg["fromUserId"]
        other_user_id_str = str(other_user_id)
        
        if other_user_id_str not in conversations:
            other_user = await db.users.find_one({"_id": other_user_id})
            if other_user:
                unread_count = await db.messages.count_documents({
                    "fromUserId": other_user_id,
                    "toUserId": user_id,
                    "read": False
                })
                
                conversations[other_user_id_str] = {
                    "userId": str(other_user["_id"]),
                    "username": other_user["username"],
                    "profilePic": other_user.get("profilePic"),
                    "lastMessage": msg["message"],
                    "timestamp": msg["timestamp"],
                    "unreadCount": unread_count
                }
    
    return list(conversations.values())

@api_router.get("/messages/{other_user_id}")
async def get_messages(other_user_id: str, authorization: Optional[str] = Header(None)):
    user = await get_current_user(authorization)
    user_id = ObjectId(user["_id"])
    other_id = ObjectId(other_user_id)
    
    # Mark messages as read
    await db.messages.update_many(
        {"fromUserId": other_id, "toUserId": user_id},
        {"$set": {"read": True}}
    )
    
    # Get messages
    messages = await db.messages.find({
        "$or": [
            {"fromUserId": user_id, "toUserId": other_id},
            {"fromUserId": other_id, "toUserId": user_id}
        ]
    }).sort("timestamp", 1).to_list(1000)
    
    return [{
        "id": str(msg["_id"]),
        "fromUserId": str(msg["fromUserId"]),
        "toUserId": str(msg["toUserId"]),
        "message": msg["message"],
        "timestamp": msg["timestamp"],
        "read": msg.get("read", False)
    } for msg in messages]

@api_router.post("/messages/send")
async def send_message(message: MessageSend, authorization: Optional[str] = Header(None)):
    user = await get_current_user(authorization)
    
    message_dict = {
        "fromUserId": ObjectId(user["_id"]),
        "toUserId": ObjectId(message.toUserId),
        "message": message.message,
        "timestamp": datetime.utcnow(),
        "read": False
    }
    
    result = await db.messages.insert_one(message_dict)
    
    return {
        "id": str(result.inserted_id),
        "fromUserId": user["_id"],
        "toUserId": message.toUserId,
        "message": message.message,
        "timestamp": message_dict["timestamp"],
        "read": False
    }

# Networking Routes
@api_router.post("/network/friend-request")
async def send_friend_request(request: FriendRequest, authorization: Optional[str] = Header(None)):
    user = await get_current_user(authorization)
    
    # Check if request already exists
    existing_request = await db.friend_requests.find_one({
        "$or": [
            {"fromUserId": ObjectId(user["_id"]), "toUserId": ObjectId(request.toUserId)},
            {"fromUserId": ObjectId(request.toUserId), "toUserId": ObjectId(user["_id"])}
        ]
    })
    
    if existing_request:
        if existing_request.get("status") == "accepted":
            return {"status": "already_connected", "message": "You are already connected"}
        return {"status": "pending", "message": "Friend request already sent"}
    
    # Create friend request
    friend_request = {
        "fromUserId": ObjectId(user["_id"]),
        "toUserId": ObjectId(request.toUserId),
        "status": "pending",
        "createdAt": datetime.utcnow()
    }
    
    await db.friend_requests.insert_one(friend_request)
    return {"status": "success", "message": "Friend request sent"}

@api_router.post("/network/accept/{request_id}")
async def accept_friend_request(request_id: str, authorization: Optional[str] = Header(None)):
    user = await get_current_user(authorization)
    
    # Update request status
    result = await db.friend_requests.update_one(
        {"_id": ObjectId(request_id), "toUserId": ObjectId(user["_id"])},
        {"$set": {"status": "accepted", "acceptedAt": datetime.utcnow()}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Friend request not found")
    
    return {"status": "success", "message": "Friend request accepted"}

@api_router.get("/network/connections")
async def get_connections(authorization: Optional[str] = Header(None)):
    user = await get_current_user(authorization)
    user_id = ObjectId(user["_id"])
    
    # Get accepted friend requests (both directions)
    connections = await db.friend_requests.find({
        "$or": [
            {"fromUserId": user_id, "status": "accepted"},
            {"toUserId": user_id, "status": "accepted"}
        ]
    }).to_list(1000)
    
    # Get user details for each connection
    connection_users = []
    for conn in connections:
        other_user_id = conn["toUserId"] if conn["fromUserId"] == user_id else conn["fromUserId"]
        other_user = await db.users.find_one({"_id": other_user_id})
        if other_user:
            connection_users.append({
                "id": str(other_user["_id"]),
                "username": other_user["username"],
                "profilePic": other_user.get("profilePic"),
                "isConnected": True
            })
    
    return connection_users

@api_router.get("/network/recent-players")
async def get_recent_players(authorization: Optional[str] = Header(None)):
    user = await get_current_user(authorization)
    user_id = ObjectId(user["_id"])
    
    # Get user's current or recent court
    current_user = await db.users.find_one({"_id": user_id})
    if not current_user or not current_user.get("currentCourtId"):
        # If no current court, find recent courts user has been to
        # For now, return all public users as potential connections
        public_users = await db.users.find({
            "_id": {"$ne": user_id},
            "isPublic": True
        }).to_list(100)
        
        recent_players = []
        for u in public_users:
            # Check if already connected
            is_connected = await db.friend_requests.find_one({
                "$or": [
                    {"fromUserId": user_id, "toUserId": u["_id"], "status": "accepted"},
                    {"fromUserId": u["_id"], "toUserId": user_id, "status": "accepted"}
                ]
            })
            
            recent_players.append({
                "id": str(u["_id"]),
                "username": u["username"],
                "profilePic": u.get("profilePic"),
                "isConnected": bool(is_connected)
            })
        
        return recent_players
    
    # Get other public users at the same court
    court_id = current_user["currentCourtId"]
    court = await db.courts.find_one({"_id": court_id})
    
    if not court or not court.get("publicUsersAtCourt"):
        return []
    
    # Get user details for public users at court
    recent_players = []
    for user_id_at_court in court["publicUsersAtCourt"]:
        if user_id_at_court == user_id:
            continue
            
        other_user = await db.users.find_one({"_id": user_id_at_court})
        if other_user:
            # Check if already connected
            is_connected = await db.friend_requests.find_one({
                "$or": [
                    {"fromUserId": user_id, "toUserId": other_user["_id"], "status": "accepted"},
                    {"fromUserId": other_user["_id"], "toUserId": user_id, "status": "accepted"}
                ]
            })
            
            recent_players.append({
                "id": str(other_user["_id"]),
                "username": other_user["username"],
                "profilePic": other_user.get("profilePic"),
                "isConnected": bool(is_connected)
            })
    
    return recent_players

# Media/YouTube Routes
@api_router.get("/media/youtube")
async def get_youtube_videos(query: str = "NBA basketball highlights"):
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                "https://www.googleapis.com/youtube/v3/search",
                params={
                    "part": "snippet",
                    "q": query,
                    "type": "video",
                    "maxResults": 20,
                    "key": YOUTUBE_API_KEY,
                    "videoCategoryId": "17"  # Sports category
                }
            )
            
            if response.status_code == 200:
                data = response.json()
                videos = []
                for item in data.get("items", []):
                    videos.append({
                        "id": item["id"]["videoId"],
                        "title": item["snippet"]["title"],
                        "description": item["snippet"]["description"],
                        "thumbnail": item["snippet"]["thumbnails"]["high"]["url"],
                        "channelTitle": item["snippet"]["channelTitle"],
                        "publishedAt": item["snippet"]["publishedAt"]
                    })
                return videos
            else:
                raise HTTPException(status_code=500, detail="Failed to fetch YouTube videos")
    except Exception as e:
        logging.error(f"YouTube API error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# Court Prediction AI Endpoint
@api_router.get("/courts/predict/recommended")
async def get_recommended_court(
    latitude: Optional[float] = None,
    longitude: Optional[float] = None
):
    """
    AI-powered court recommendation based on:
    - Current weather conditions
    - Time of day and day of week
    - Historical player patterns
    - Social media activity (mocked for MVP)
    - User location
    """
    try:
        # Get environment variables
        weather_api_key = os.environ.get('OPENWEATHER_API_KEY')
        openai_key = os.environ.get('EMERGENT_LLM_KEY')
        
        if not weather_api_key or not openai_key:
            raise HTTPException(status_code=500, detail="API keys not configured")
        
        # Use default LA coordinates if not provided
        if not latitude or not longitude:
            latitude = 34.0522  # Los Angeles
            longitude = -118.2437
        
        # 1. Fetch current weather
        weather_url = f"https://api.openweathermap.org/data/2.5/weather?lat={latitude}&lon={longitude}&appid={weather_api_key}&units=imperial"
        
        async with httpx.AsyncClient() as client:
            weather_response = await client.get(weather_url)
            weather_data = weather_response.json()
        
        weather_condition = weather_data.get("weather", [{}])[0].get("main", "Clear")
        temperature = weather_data.get("main", {}).get("temp", 70)
        
        # 2. Get current time info
        now = datetime.now()
        day_of_week = now.strftime("%A")
        hour = now.hour
        time_of_day = "morning" if 6 <= hour < 12 else "afternoon" if 12 <= hour < 17 else "evening" if 17 <= hour < 21 else "night"
        is_weekend = now.weekday() >= 5
        
        # 3. Get all courts
        courts = await db.courts.find().to_list(1000)
        
        # 4. Add mock social media activity scores (0-100)
        import random
        random.seed(now.day)  # Consistent for the day
        for court in courts:
            court["socialMediaScore"] = random.randint(20, 95)
            court["lastPostMinutesAgo"] = random.randint(15, 240)
        
        # 5. Prepare data for AI analysis
        court_data_for_ai = []
        for court in courts:
            court_info = {
                "name": court["name"],
                "address": court["address"],
                "currentPlayers": court.get("currentPlayers", 0),
                "averagePlayers": court.get("averagePlayers", 12),
                "rating": court["rating"],
                "socialMediaScore": court["socialMediaScore"],
                "lastPostMinutesAgo": court["lastPostMinutesAgo"]
            }
            court_data_for_ai.append(court_info)
        
        # 6. Use OpenAI GPT-5 to analyze and predict
        ai_prompt = f"""You are an AI that predicts which basketball court will be most active based on multiple factors.

Current Conditions:
- Day: {day_of_week} ({'Weekend' if is_weekend else 'Weekday'})
- Time: {time_of_day} ({hour}:00)
- Weather: {weather_condition}, {temperature}°F

Courts Data:
{court_data_for_ai}

Analysis Factors:
1. Weather Impact: Good weather ({weather_condition}) increases outdoor activity
2. Time Patterns: {time_of_day} on {day_of_week}
3. Current Activity: Current players at each court
4. Social Media: Recent posts indicate activity (lower minutes = more recent)
5. Historical Average: Average players per court
6. Rating: Higher rated courts attract more players

Task: Analyze these factors and select THE SINGLE BEST court that will likely have the most players to play with. 
Consider that players prefer:
- Good weather conditions
- Peak hours (evening/afternoon on weekends, evening on weekdays)
- Courts with recent social media activity
- Higher rated courts
- Courts showing current activity or momentum

Return ONLY a valid JSON object with this exact structure (no markdown, no code blocks):
{{
    "recommendedCourt": "EXACT court name from the list",
    "confidenceScore": 75,
    "reasoning": "Brief 2-sentence explanation focusing on the top 2-3 factors"
}}"""

        # Call OpenAI API with Emergent key
        async with httpx.AsyncClient() as client:
            ai_response = await client.post(
                "https://api.openai.com/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {openai_key}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": "gpt-4",
                    "messages": [
                        {"role": "system", "content": "You are a basketball court activity prediction AI. Always respond with valid JSON only."},
                        {"role": "user", "content": ai_prompt}
                    ],
                    "temperature": 0.7,
                    "max_tokens": 300
                },
                timeout=30.0
            )
            
            ai_data = ai_response.json()
            logging.info(f"OpenAI response: {ai_data}")
            
            # Check if response is successful
            if "choices" not in ai_data or len(ai_data["choices"]) == 0:
                raise Exception(f"Invalid AI response: {ai_data}")
            
            ai_content = ai_data["choices"][0]["message"]["content"].strip()
            
            # Parse AI response (remove markdown if present)
            if ai_content.startswith("```"):
                ai_content = ai_content.split("```")[1]
                if ai_content.startswith("json"):
                    ai_content = ai_content[4:]
                ai_content = ai_content.strip()
            
            import json
            prediction = json.loads(ai_content)
        
        # 7. Find the recommended court
        recommended_court_name = prediction["recommendedCourt"]
        recommended_court = None
        
        for court in courts:
            if court["name"].lower() == recommended_court_name.lower():
                recommended_court = court
                break
        
        if not recommended_court:
            # Fallback: pick court with highest combined score
            recommended_court = max(courts, key=lambda c: (c.get("currentPlayers", 0) * 2 + c.get("socialMediaScore", 50) + c.get("rating", 4) * 10))
        
        return {
            "recommendedCourtId": str(recommended_court["_id"]),
            "courtName": recommended_court["name"],
            "confidenceScore": prediction.get("confidenceScore", 75),
            "reasoning": prediction.get("reasoning", "Based on current conditions and activity patterns"),
            "weather": {
                "condition": weather_condition,
                "temperature": temperature
            },
            "timeContext": {
                "dayOfWeek": day_of_week,
                "timeOfDay": time_of_day,
                "isWeekend": is_weekend
            }
        }
        
    except Exception as e:
        logging.error(f"Court prediction error: {str(e)}")
        # Fallback: return court with most current players
        courts = await db.courts.find().to_list(1000)
        if courts:
            best_court = max(courts, key=lambda c: c.get("currentPlayers", 0))
            return {
                "recommendedCourtId": str(best_court["_id"]),
                "courtName": best_court["name"],
                "confidenceScore": 60,
                "reasoning": "Based on current player activity",
                "weather": None,
                "timeContext": None
            }
        raise HTTPException(status_code=500, detail=str(e))

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("startup")
async def startup_event():
    await initialize_courts()

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
