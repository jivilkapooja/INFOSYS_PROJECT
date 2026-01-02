from flask import Blueprint, request, jsonify
from flask_bcrypt import Bcrypt
from flask_jwt_extended import create_access_token
from db import cursor, db

auth = Blueprint("auth", __name__)
bcrypt = Bcrypt()

# 🔐 LOGIN
@auth.route("/login", methods=["POST"])
def login():
    data = request.json
    username = data.get("username")
    password = data.get("password")

    cursor.execute(
        "SELECT password FROM users WHERE username=%s",
        (username,)
    )
    user = cursor.fetchone()

    if not user:
        return jsonify({"msg": "User not found"}), 401

    if not bcrypt.check_password_hash(user["password"], password):
        return jsonify({"msg": "Invalid password"}), 401

    token = create_access_token(identity=username)
    return jsonify({"token": token}), 200


# 📝 REGISTER
@auth.route("/register", methods=["POST"])
def register():
    data = request.json
    username = data.get("username")
    password = data.get("password")
    phone = data.get("phone_number")

    if not username or not password or not phone:
        return jsonify({"msg": "All fields are required"}), 400

    cursor.execute(
        "SELECT password FROM users WHERE username=%s",
        (username,)
    )
    if cursor.fetchone():
        return jsonify({"msg": "Username already exists"}), 409

    hashed_pw = bcrypt.generate_password_hash(password).decode("utf-8")

    cursor.execute(
        "INSERT INTO users (username, password, phone_number) VALUES (%s, %s, %s)",
        (username, hashed_pw, phone)
    )
    db.commit()

    return jsonify({"msg": "User registered successfully"}), 201
