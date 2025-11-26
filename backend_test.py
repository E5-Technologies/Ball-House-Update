#!/usr/bin/env python3
"""
Basketball Court Finder App - Backend API Testing
Tests all backend endpoints for functionality and data integrity
"""

import requests
import json
import time
import base64
from datetime import datetime

# Configuration
BASE_URL = "https://ballhouse-app.preview.emergentagent.com/api"
TIMEOUT = 30

class BackendTester:
    def __init__(self):
        self.session = requests.Session()
        self.session.timeout = TIMEOUT
        self.test_users = []
        self.auth_tokens = {}
        self.court_ids = []
        self.results = {
            "passed": 0,
            "failed": 0,
            "errors": []
        }
    
    def log_result(self, test_name, success, message="", response=None):
        """Log test results"""
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status}: {test_name}")
        if message:
            print(f"   {message}")
        if response and not success:
            print(f"   Response: {response.status_code} - {response.text[:200]}")
        
        if success:
            self.results["passed"] += 1
        else:
            self.results["failed"] += 1
            self.results["errors"].append(f"{test_name}: {message}")
        print()
    
    def test_user_registration(self):
        """Test user registration endpoint"""
        print("🔐 Testing User Registration...")
        
        # Test valid registration
        test_user = {
            "username": f"testuser_{int(time.time())}",
            "email": f"test_{int(time.time())}@example.com",
            "password": "securepassword123"
        }
        
        try:
            response = self.session.post(f"{BASE_URL}/auth/register", json=test_user)
            
            if response.status_code == 200:
                data = response.json()
                if "token" in data and "user" in data:
                    self.test_users.append(test_user)
                    self.auth_tokens[test_user["email"]] = data["token"]
                    self.log_result("User Registration", True, f"User {test_user['username']} registered successfully")
                    return True
                else:
                    self.log_result("User Registration", False, "Missing token or user in response", response)
            else:
                self.log_result("User Registration", False, f"Registration failed with status {response.status_code}", response)
        except Exception as e:
            self.log_result("User Registration", False, f"Exception: {str(e)}")
        
        return False
    
    def test_user_login(self):
        """Test user login endpoint"""
        print("🔑 Testing User Login...")
        
        if not self.test_users:
            self.log_result("User Login", False, "No test users available for login test")
            return False
        
        test_user = self.test_users[0]
        login_data = {
            "email": test_user["email"],
            "password": test_user["password"]
        }
        
        try:
            response = self.session.post(f"{BASE_URL}/auth/login", json=login_data)
            
            if response.status_code == 200:
                data = response.json()
                if "token" in data and "user" in data:
                    self.auth_tokens[test_user["email"]] = data["token"]
                    self.log_result("User Login", True, f"Login successful for {test_user['email']}")
                    return True
                else:
                    self.log_result("User Login", False, "Missing token or user in response", response)
            else:
                self.log_result("User Login", False, f"Login failed with status {response.status_code}", response)
        except Exception as e:
            self.log_result("User Login", False, f"Exception: {str(e)}")
        
        return False
    
    def test_auth_me(self):
        """Test get current user endpoint"""
        print("👤 Testing Auth Me Endpoint...")
        
        if not self.auth_tokens:
            self.log_result("Auth Me", False, "No auth tokens available")
            return False
        
        token = list(self.auth_tokens.values())[0]
        headers = {"Authorization": f"Bearer {token}"}
        
        try:
            response = self.session.get(f"{BASE_URL}/auth/me", headers=headers)
            
            if response.status_code == 200:
                data = response.json()
                if "id" in data and "username" in data and "email" in data:
                    self.log_result("Auth Me", True, f"User info retrieved: {data['username']}")
                    return True
                else:
                    self.log_result("Auth Me", False, "Missing required user fields", response)
            else:
                self.log_result("Auth Me", False, f"Auth me failed with status {response.status_code}", response)
        except Exception as e:
            self.log_result("Auth Me", False, f"Exception: {str(e)}")
        
        return False
    
    def test_courts_api(self):
        """Test courts API endpoints"""
        print("🏀 Testing Courts API...")
        
        # Test get all courts
        try:
            response = self.session.get(f"{BASE_URL}/courts")
            
            if response.status_code == 200:
                courts = response.json()
                if isinstance(courts, list) and len(courts) == 8:
                    # Verify court data structure
                    required_fields = ["id", "name", "address", "latitude", "longitude", "hours", "phoneNumber", "rating", "currentPlayers"]
                    first_court = courts[0]
                    
                    if all(field in first_court for field in required_fields):
                        self.court_ids = [court["id"] for court in courts]
                        self.log_result("Get All Courts", True, f"Retrieved {len(courts)} Houston basketball courts")
                        
                        # Test get specific court
                        court_id = self.court_ids[0]
                        court_response = self.session.get(f"{BASE_URL}/courts/{court_id}")
                        
                        if court_response.status_code == 200:
                            court_data = court_response.json()
                            if all(field in court_data for field in required_fields):
                                self.log_result("Get Specific Court", True, f"Retrieved court: {court_data['name']}")
                                return True
                            else:
                                self.log_result("Get Specific Court", False, "Missing required court fields", court_response)
                        else:
                            self.log_result("Get Specific Court", False, f"Failed with status {court_response.status_code}", court_response)
                    else:
                        missing_fields = [field for field in required_fields if field not in first_court]
                        self.log_result("Get All Courts", False, f"Missing fields: {missing_fields}", response)
                else:
                    self.log_result("Get All Courts", False, f"Expected 8 courts, got {len(courts) if isinstance(courts, list) else 'non-list'}", response)
            else:
                self.log_result("Get All Courts", False, f"Failed with status {response.status_code}", response)
        except Exception as e:
            self.log_result("Courts API", False, f"Exception: {str(e)}")
        
        return False
    
    def test_checkin_checkout_system(self):
        """Test court check-in and check-out system"""
        print("📍 Testing Check-in/Check-out System...")
        
        if not self.auth_tokens or not self.court_ids:
            self.log_result("Check-in/Check-out", False, "Missing auth tokens or court IDs")
            return False
        
        token = list(self.auth_tokens.values())[0]
        headers = {"Authorization": f"Bearer {token}"}
        court_id = self.court_ids[0]
        
        try:
            # Get initial player count
            court_response = self.session.get(f"{BASE_URL}/courts/{court_id}")
            initial_count = court_response.json()["currentPlayers"] if court_response.status_code == 200 else 0
            
            # Test check-in
            checkin_response = self.session.post(f"{BASE_URL}/courts/{court_id}/checkin", headers=headers)
            
            if checkin_response.status_code == 200:
                checkin_data = checkin_response.json()
                if "currentPlayers" in checkin_data and checkin_data["currentPlayers"] == initial_count + 1:
                    self.log_result("Court Check-in", True, f"Player count increased to {checkin_data['currentPlayers']}")
                    
                    # Test check-out
                    checkout_response = self.session.post(f"{BASE_URL}/courts/{court_id}/checkout", headers=headers)
                    
                    if checkout_response.status_code == 200:
                        checkout_data = checkout_response.json()
                        if "currentPlayers" in checkout_data and checkout_data["currentPlayers"] == initial_count:
                            self.log_result("Court Check-out", True, f"Player count decreased to {checkout_data['currentPlayers']}")
                            return True
                        else:
                            self.log_result("Court Check-out", False, "Player count not decreased correctly", checkout_response)
                    else:
                        self.log_result("Court Check-out", False, f"Check-out failed with status {checkout_response.status_code}", checkout_response)
                else:
                    self.log_result("Court Check-in", False, "Player count not increased correctly", checkin_response)
            else:
                self.log_result("Court Check-in", False, f"Check-in failed with status {checkin_response.status_code}", checkin_response)
        except Exception as e:
            self.log_result("Check-in/Check-out", False, f"Exception: {str(e)}")
        
        return False
    
    def test_privacy_toggle(self):
        """Test privacy toggle functionality"""
        print("🔒 Testing Privacy Toggle...")
        
        if not self.auth_tokens:
            self.log_result("Privacy Toggle", False, "No auth tokens available")
            return False
        
        token = list(self.auth_tokens.values())[0]
        headers = {"Authorization": f"Bearer {token}"}
        
        try:
            # Get current privacy status
            me_response = self.session.get(f"{BASE_URL}/auth/me", headers=headers)
            if me_response.status_code != 200:
                self.log_result("Privacy Toggle", False, "Could not get current user info")
                return False
            
            initial_public = me_response.json().get("isPublic", True)
            
            # Toggle privacy
            toggle_response = self.session.put(f"{BASE_URL}/users/toggle-privacy", headers=headers)
            
            if toggle_response.status_code == 200:
                toggle_data = toggle_response.json()
                if "isPublic" in toggle_data and toggle_data["isPublic"] != initial_public:
                    self.log_result("Privacy Toggle", True, f"Privacy toggled from {initial_public} to {toggle_data['isPublic']}")
                    return True
                else:
                    self.log_result("Privacy Toggle", False, "Privacy status not toggled correctly", toggle_response)
            else:
                self.log_result("Privacy Toggle", False, f"Toggle failed with status {toggle_response.status_code}", toggle_response)
        except Exception as e:
            self.log_result("Privacy Toggle", False, f"Exception: {str(e)}")
        
        return False
    
    def test_messaging_system(self):
        """Test messaging system"""
        print("💬 Testing Messaging System...")
        
        # Create second test user for messaging
        if len(self.test_users) < 2:
            second_user = {
                "username": f"testuser2_{int(time.time())}",
                "email": f"test2_{int(time.time())}@example.com",
                "password": "securepassword123"
            }
            
            try:
                response = self.session.post(f"{BASE_URL}/auth/register", json=second_user)
                if response.status_code == 200:
                    data = response.json()
                    self.test_users.append(second_user)
                    self.auth_tokens[second_user["email"]] = data["token"]
                else:
                    self.log_result("Messaging System", False, "Could not create second test user")
                    return False
            except Exception as e:
                self.log_result("Messaging System", False, f"Exception creating second user: {str(e)}")
                return False
        
        # Get user IDs
        try:
            user1_token = list(self.auth_tokens.values())[0]
            user2_token = list(self.auth_tokens.values())[1]
            
            user1_headers = {"Authorization": f"Bearer {user1_token}"}
            user2_headers = {"Authorization": f"Bearer {user2_token}"}
            
            # Get user1 info
            user1_response = self.session.get(f"{BASE_URL}/auth/me", headers=user1_headers)
            user2_response = self.session.get(f"{BASE_URL}/auth/me", headers=user2_headers)
            
            if user1_response.status_code != 200 or user2_response.status_code != 200:
                self.log_result("Messaging System", False, "Could not get user info for messaging test")
                return False
            
            user1_id = user1_response.json()["id"]
            user2_id = user2_response.json()["id"]
            
            # Send message from user1 to user2
            message_data = {
                "toUserId": user2_id,
                "message": "Hello from test user 1! This is a test message."
            }
            
            send_response = self.session.post(f"{BASE_URL}/messages/send", json=message_data, headers=user1_headers)
            
            if send_response.status_code == 200:
                self.log_result("Send Message", True, "Message sent successfully")
                
                # Get messages for user2
                messages_response = self.session.get(f"{BASE_URL}/messages/{user1_id}", headers=user2_headers)
                
                if messages_response.status_code == 200:
                    messages = messages_response.json()
                    if isinstance(messages, list) and len(messages) > 0:
                        self.log_result("Get Messages", True, f"Retrieved {len(messages)} messages")
                        
                        # Get conversations
                        conv_response = self.session.get(f"{BASE_URL}/messages/conversations", headers=user2_headers)
                        
                        if conv_response.status_code == 200:
                            conversations = conv_response.json()
                            if isinstance(conversations, list) and len(conversations) > 0:
                                self.log_result("Get Conversations", True, f"Retrieved {len(conversations)} conversations")
                                return True
                            else:
                                self.log_result("Get Conversations", False, "No conversations found", conv_response)
                        else:
                            self.log_result("Get Conversations", False, f"Failed with status {conv_response.status_code}", conv_response)
                    else:
                        self.log_result("Get Messages", False, "No messages retrieved", messages_response)
                else:
                    self.log_result("Get Messages", False, f"Failed with status {messages_response.status_code}", messages_response)
            else:
                self.log_result("Send Message", False, f"Failed with status {send_response.status_code}", send_response)
        except Exception as e:
            self.log_result("Messaging System", False, f"Exception: {str(e)}")
        
        return False
    
    def test_youtube_api(self):
        """Test YouTube API integration"""
        print("📺 Testing YouTube API...")
        
        try:
            # Test default query
            response = self.session.get(f"{BASE_URL}/media/youtube")
            
            if response.status_code == 200:
                videos = response.json()
                if isinstance(videos, list) and len(videos) > 0:
                    # Check video structure
                    required_fields = ["id", "title", "thumbnail", "channelTitle"]
                    first_video = videos[0]
                    
                    if all(field in first_video for field in required_fields):
                        self.log_result("YouTube API Default", True, f"Retrieved {len(videos)} basketball videos")
                        
                        # Test custom query
                        custom_response = self.session.get(f"{BASE_URL}/media/youtube?query=NBA+basketball")
                        
                        if custom_response.status_code == 200:
                            custom_videos = custom_response.json()
                            if isinstance(custom_videos, list) and len(custom_videos) > 0:
                                self.log_result("YouTube API Custom Query", True, f"Retrieved {len(custom_videos)} NBA videos")
                                return True
                            else:
                                self.log_result("YouTube API Custom Query", False, "No videos for custom query", custom_response)
                        else:
                            self.log_result("YouTube API Custom Query", False, f"Failed with status {custom_response.status_code}", custom_response)
                    else:
                        missing_fields = [field for field in required_fields if field not in first_video]
                        self.log_result("YouTube API Default", False, f"Missing video fields: {missing_fields}", response)
                else:
                    self.log_result("YouTube API Default", False, "No videos retrieved", response)
            else:
                self.log_result("YouTube API Default", False, f"Failed with status {response.status_code}", response)
        except Exception as e:
            self.log_result("YouTube API", False, f"Exception: {str(e)}")
        
        return False
    
    def test_profile_update(self):
        """Test profile update functionality"""
        print("👤 Testing Profile Update...")
        
        if not self.auth_tokens:
            self.log_result("Profile Update", False, "No auth tokens available")
            return False
        
        token = list(self.auth_tokens.values())[0]
        headers = {"Authorization": f"Bearer {token}"}
        
        try:
            # Test username update
            new_username = f"updated_user_{int(time.time())}"
            update_data = {"username": new_username}
            
            response = self.session.put(f"{BASE_URL}/users/profile", json=update_data, headers=headers)
            
            if response.status_code == 200:
                user_data = response.json()
                if user_data.get("username") == new_username:
                    self.log_result("Profile Username Update", True, f"Username updated to {new_username}")
                    
                    # Test profile picture update (base64)
                    # Create a small test image in base64
                    test_image_b64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
                    pic_update_data = {"profilePic": test_image_b64}
                    
                    pic_response = self.session.put(f"{BASE_URL}/users/profile", json=pic_update_data, headers=headers)
                    
                    if pic_response.status_code == 200:
                        pic_data = pic_response.json()
                        if pic_data.get("profilePic") == test_image_b64:
                            self.log_result("Profile Picture Update", True, "Profile picture updated successfully")
                            return True
                        else:
                            self.log_result("Profile Picture Update", False, "Profile picture not updated correctly", pic_response)
                    else:
                        self.log_result("Profile Picture Update", False, f"Failed with status {pic_response.status_code}", pic_response)
                else:
                    self.log_result("Profile Username Update", False, "Username not updated correctly", response)
            else:
                self.log_result("Profile Username Update", False, f"Failed with status {response.status_code}", response)
        except Exception as e:
            self.log_result("Profile Update", False, f"Exception: {str(e)}")
        
        return False
    
    def test_error_cases(self):
        """Test error handling"""
        print("⚠️ Testing Error Cases...")
        
        try:
            # Test unauthorized access
            response = self.session.get(f"{BASE_URL}/auth/me")
            if response.status_code == 401:
                self.log_result("Unauthorized Access", True, "Correctly rejected unauthorized request")
            else:
                self.log_result("Unauthorized Access", False, f"Expected 401, got {response.status_code}")
            
            # Test invalid court ID
            response = self.session.get(f"{BASE_URL}/courts/invalid_id")
            if response.status_code in [400, 404]:
                self.log_result("Invalid Court ID", True, "Correctly handled invalid court ID")
            else:
                self.log_result("Invalid Court ID", False, f"Expected 400/404, got {response.status_code}")
            
            # Test invalid login
            response = self.session.post(f"{BASE_URL}/auth/login", json={"email": "fake@test.com", "password": "wrong"})
            if response.status_code == 401:
                self.log_result("Invalid Login", True, "Correctly rejected invalid login")
                return True
            else:
                self.log_result("Invalid Login", False, f"Expected 401, got {response.status_code}")
        except Exception as e:
            self.log_result("Error Cases", False, f"Exception: {str(e)}")
        
        return False
    
    def run_all_tests(self):
        """Run all backend tests"""
        print("🚀 Starting Basketball Court Finder Backend API Tests")
        print(f"Testing against: {BASE_URL}")
        print("=" * 60)
        
        # Run tests in order
        self.test_user_registration()
        self.test_user_login()
        self.test_auth_me()
        self.test_courts_api()
        self.test_checkin_checkout_system()
        self.test_privacy_toggle()
        self.test_messaging_system()
        self.test_youtube_api()
        self.test_profile_update()
        self.test_error_cases()
        
        # Print summary
        print("=" * 60)
        print("🏁 TEST SUMMARY")
        print(f"✅ Passed: {self.results['passed']}")
        print(f"❌ Failed: {self.results['failed']}")
        print(f"📊 Success Rate: {(self.results['passed'] / (self.results['passed'] + self.results['failed']) * 100):.1f}%")
        
        if self.results['errors']:
            print("\n🚨 FAILED TESTS:")
            for error in self.results['errors']:
                print(f"   • {error}")
        
        return self.results['failed'] == 0

if __name__ == "__main__":
    tester = BackendTester()
    success = tester.run_all_tests()
    exit(0 if success else 1)