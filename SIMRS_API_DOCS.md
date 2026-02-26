# SIMRS API Documentation

This document provides a comprehensive overview of the SIMRS API endpoints integrated into the Monitoring Order application.

## 🔗 Connection Details

- **Base URL**: `http://103.148.235.37:5010`
- **Authentication**: Custom header `access-token` with a JWT token.
- **Login Endpoint**: `POST /secure/auth_validate_login`
  - **Body**: `{ "login": "USERNAME", "pwd": "PASSWORD" }`
  - **Response**: `{ "result": true, "token": "JWT_TOKEN" }`

## 📡 Endpoints

### 1. Group Summary
- **Endpoint**: `GET /redis/get_summary_order`
- **Description**: Returns counts of orders by their current status.
- **Response Format**:
  ```json
  {
    "result": {
      "open": 0,
      "follow_up": 89,
      "running": 44,
      "done": 73,
      "verified": 4872,
      "pending": 56
    }
  }
  ```

### 2. Order List by Status
- **Endpoint**: `GET /order/order_list_by_status/{status_id}`
- **Status IDs**:
  - `10`: OPEN
  - `11`: FOLLOW UP
  - `12`: RUNNING
  - `13`: PENDING
  - `15`: DONE
  - `30`: VERIFIED
- **Item Format**:
  ```json
  {
    "order_id": 12345,
    "order_no": "20.54188",
    "create_date": "25 Feb 2026 1:26PM",
    "order_by": "Mbak Riri",
    "location_desc": "Farmasi Merpati",
    "catatan": "printer zebra rebonyya keluar di saat mau ngeprint",
    "status_desc": "FOLLOW UP",
    "nama_teknisi": "Adit Setiawan"
  }
  ```

### 3. Order Detail
- **Endpoint**: `GET /order/order_detail_by_id/{order_id}`
- **Description**: Fetches comprehensive detail for a single order.

### 4. Order History
- **Endpoint**: `GET /order/order_history_by_id/{order_id}`
- **Description**: Returns status change logs for an order.

### 6. Analytics API
- **Endpoint**: `/api/orders/analytics` (Internal proxy)
- **Status ID used**: `15` (DONE)
- **Query Parameters**:
  - `type`: `daily`, `weekly`, or `monthly`.
  - `month`: Filter by creation month (1-12).
  - `year`: Filter by creation year (e.g., 2026).
- **Processing**: Fetches order histories to calculate duration between "FOLLOW UP" and "DONE" statuses.

## 🛠 Handled Edge Cases

### Note Cleaning (`getCleanedSIMRSNote`)
The SIMRS API sometimes returns placeholders in the `catatan` field if no note was provided (e.g., repeating the order number). Our system filters these out to prioritize actual user-entered notes.

### Date Parsing (`parseSIMRSDate`)
Handles multiple date formats returned by SIMRS:
1. `DD Mon YY - HH:mm` (e.g., `25 Feb 26 - 15:04`)
2. `Mon DD YYYY HH:mmAM/PM` (e.g., `Feb 25 2026 9:14PM`)
