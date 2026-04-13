# MongoDB Schema - WRECTIFAI (PRD-Aligned)

Source of truth: `WRECTIFAI PRD V_0.1.pdf`

This schema is aligned to PRD scope:
- AI diagnosis
- Vehicle management
- Garage ecosystem + quote system
- Marketplace + orders
- In-app payments
- Ratings and trust
- Strict RBAC

## 1) RBAC Identity Collections

### `users`
| Field | Type | Required | Key | Notes |
| --- | --- | --- | --- | --- |
| `_id` | ObjectId | Yes | PK | User identity |
| `email` | String | Conditional | Candidate unique | Required for email auth users/admin |
| `mobileNumber` | String | Conditional | Candidate unique | Optional login/contact |
| `passwordHash` | String | Conditional | - | For password auth |
| `name` | String | Yes | - | Display name |
| `status` | String enum | Yes | Indexed | `active`, `suspended`, `pendingVerification` |
| `createdAt` | Date | Yes | Indexed | Audit |
| `updatedAt` | Date | Yes | - | Audit |

### `roles`
| Field | Type | Required | Key | Notes |
| --- | --- | --- | --- | --- |
| `_id` | ObjectId | Yes | PK | Role identity |
| `code` | String enum | Yes | Candidate unique | `customer`, `garage`, `vendor`, `admin` |
| `name` | String | Yes | - | Human readable |
| `createdAt` | Date | Yes | - | Audit |
| `updatedAt` | Date | Yes | - | Audit |

### `user_roles`
| Field | Type | Required | Key | Notes |
| --- | --- | --- | --- | --- |
| `_id` | ObjectId | Yes | PK | Mapping identity |
| `userId` | ObjectId | Yes | FK (logical) | Ref `users._id` |
| `roleId` | ObjectId | Yes | FK (logical) | Ref `roles._id` |
| `createdAt` | Date | Yes | - | Audit |
| `updatedAt` | Date | Yes | - | Audit |

Constraint:
- Unique composite index on `{ userId: 1, roleId: 1 }`.

## 2) Vehicle Collections

### `vehicles`
| Field | Type | Required | Key | Notes |
| --- | --- | --- | --- | --- |
| `_id` | ObjectId | Yes | PK | Vehicle identity |
| `customerId` | ObjectId | Yes | Indexed | Ref `users._id` |
| `make` | String | Yes | - | |
| `model` | String | Yes | - | |
| `year` | Number | Yes | - | |
| `vin` | String | No | Candidate unique | Optional |
| `mileage` | Number | No | - | |
| `warranty` | Object | No | - | provider, policyNo, expiry |
| `createdAt` | Date | Yes | Indexed | |
| `updatedAt` | Date | Yes | - | |

### `vehicle_service_history`
| Field | Type | Required | Key | Notes |
| --- | --- | --- | --- | --- |
| `_id` | ObjectId | Yes | PK | |
| `vehicleId` | ObjectId | Yes | Indexed | Ref `vehicles._id` |
| `serviceDate` | Date | Yes | - | |
| `description` | String | Yes | - | |
| `garageId` | ObjectId | No | - | Ref `garages._id` |
| `cost` | Number | No | - | |
| `createdAt` | Date | Yes | - | |

## 3) Diagnosis Collections

### `diagnosis_requests`
| Field | Type | Required | Key | Notes |
| --- | --- | --- | --- | --- |
| `_id` | ObjectId | Yes | PK | |
| `customerId` | ObjectId | Yes | Indexed | |
| `vehicleId` | ObjectId | Yes | Indexed | |
| `symptomText` | String | No | - | |
| `status` | String enum | Yes | Indexed | `received`, `processing`, `completed`, `failed` |
| `createdAt` | Date | Yes | - | |

### `diagnosis_media`
| Field | Type | Required | Key | Notes |
| --- | --- | --- | --- | --- |
| `_id` | ObjectId | Yes | PK | |
| `diagnosisRequestId` | ObjectId | Yes | Indexed | |
| `mediaType` | String enum | Yes | - | `image`, `video`, `audio` |
| `url` | String | Yes | - | Storage URL |
| `createdAt` | Date | Yes | - | |

### `diagnosis_results`
| Field | Type | Required | Key | Notes |
| --- | --- | --- | --- | --- |
| `_id` | ObjectId | Yes | PK | |
| `diagnosisRequestId` | ObjectId | Yes | Unique | one result per request |
| `issues` | Array<Object> | Yes | - | issue + confidence |
| `confidenceScore` | Number | Yes | - | 0-100 |
| `riskLevel` | String enum | Yes | Indexed | `low`, `medium`, `high`, `critical` |
| `diyAllowed` | Boolean | Yes | - | must be false for high/critical |
| `diySteps` | Array<String> | No | - | safe issues only |
| `nextAction` | String enum | Yes | - | `diy`, `bookGarage`, `buyParts` |
| `createdAt` | Date | Yes | - | |

## 4) Garage and Quote Collections

### `garages`
| Field | Type | Required | Key | Notes |
| --- | --- | --- | --- | --- |
| `_id` | ObjectId | Yes | PK | Garage profile |
| `ownerUserId` | ObjectId | Yes | Indexed | garage user |
| `name` | String | Yes | - | |
| `address` | String | Yes | - | |
| `location` | GeoJSON Point | No | 2dsphere | for nearby search |
| `specializations` | Array<String> | No | Indexed | engine, EV, etc |
| `certifications` | Array<String> | No | - | |
| `pickupDropSupported` | Boolean | Yes | - | optional service |
| `approvalStatus` | String enum | Yes | Indexed | `pending`, `approved`, `rejected`, `suspended` |
| `ratingAvg` | Number | No | - | denormalized |
| `ratingCount` | Number | No | - | denormalized |
| `createdAt` | Date | Yes | - | |
| `updatedAt` | Date | Yes | - | |

### `garage_documents`
| Field | Type | Required | Key | Notes |
| --- | --- | --- | --- | --- |
| `_id` | ObjectId | Yes | PK | |
| `garageId` | ObjectId | Yes | Indexed | |
| `docType` | String | Yes | - | license, cert |
| `fileUrl` | String | Yes | - | |
| `verificationStatus` | String enum | Yes | Indexed | `pending`, `approved`, `rejected` |
| `reviewedBy` | ObjectId | No | - | admin user |
| `reviewedAt` | Date | No | - | |
| `createdAt` | Date | Yes | - | |

### `garage_slots`
| Field | Type | Required | Key | Notes |
| --- | --- | --- | --- | --- |
| `_id` | ObjectId | Yes | PK | |
| `garageId` | ObjectId | Yes | Indexed | |
| `startAt` | Date | Yes | Indexed | |
| `endAt` | Date | Yes | - | |
| `isAvailable` | Boolean | Yes | Indexed | |

### `quote_requests`
| Field | Type | Required | Key | Notes |
| --- | --- | --- | --- | --- |
| `_id` | ObjectId | Yes | PK | |
| `customerId` | ObjectId | Yes | Indexed | |
| `vehicleId` | ObjectId | Yes | Indexed | |
| `diagnosisRequestId` | ObjectId | No | - | |
| `issueSummary` | String | Yes | - | |
| `preferredDate` | Date | No | - | |
| `status` | String enum | Yes | Indexed | `open`, `quoted`, `selected`, `expired`, `cancelled` |
| `createdAt` | Date | Yes | - | |

### `quotes`
| Field | Type | Required | Key | Notes |
| --- | --- | --- | --- | --- |
| `_id` | ObjectId | Yes | PK | |
| `quoteRequestId` | ObjectId | Yes | Indexed | |
| `garageId` | ObjectId | Yes | Indexed | |
| `amount` | Number | Yes | - | |
| `currency` | String | Yes | - | `USD` |
| `etaDays` | Number | No | - | |
| `status` | String enum | Yes | Indexed | `active`, `selected`, `rejected`, `withdrawn` |
| `createdAt` | Date | Yes | - | |

### `bookings`
| Field | Type | Required | Key | Notes |
| --- | --- | --- | --- | --- |
| `_id` | ObjectId | Yes | PK | |
| `customerId` | ObjectId | Yes | Indexed | |
| `garageId` | ObjectId | Yes | Indexed | |
| `vehicleId` | ObjectId | Yes | Indexed | |
| `quoteId` | ObjectId | No | - | null for instant booking |
| `bookingType` | String enum | Yes | Indexed | `instant`, `quoteBased` |
| `scheduledAt` | Date | Yes | Indexed | |
| `status` | String enum | Yes | Indexed | `pendingPayment`, `confirmed`, `inService`, `completed`, `cancelled` |
| `totalAmount` | Number | Yes | - | |
| `currency` | String | Yes | - | `USD` |
| `createdAt` | Date | Yes | - | |
| `updatedAt` | Date | Yes | - | |

## 5) Marketplace Collections

### `sellers`
| Field | Type | Required | Key | Notes |
| --- | --- | --- | --- | --- |
| `_id` | ObjectId | Yes | PK | |
| `sellerType` | String enum | Yes | Indexed | `platform`, `garage`, `vendor` |
| `userId` | ObjectId | No | Indexed | vendor user |
| `garageId` | ObjectId | No | Indexed | garage seller |
| `approvalStatus` | String enum | Yes | Indexed | `pending`, `approved`, `rejected` |
| `createdAt` | Date | Yes | - | |

### `products`
| Field | Type | Required | Key | Notes |
| --- | --- | --- | --- | --- |
| `_id` | ObjectId | Yes | PK | |
| `sellerId` | ObjectId | Yes | Indexed | |
| `name` | String | Yes | Indexed | |
| `description` | String | No | - | |
| `category` | String | Yes | Indexed | |
| `price` | Number | Yes | - | |
| `currency` | String | Yes | - | `USD` |
| `isDiyKit` | Boolean | Yes | Indexed | DIY kit support |
| `isActive` | Boolean | Yes | Indexed | |
| `compatibleVehicleRules` | Object | No | - | make/model/year matching |
| `createdAt` | Date | Yes | - | |
| `updatedAt` | Date | Yes | - | |

### `inventory`
| Field | Type | Required | Key | Notes |
| --- | --- | --- | --- | --- |
| `_id` | ObjectId | Yes | PK | |
| `productId` | ObjectId | Yes | Unique | |
| `qtyAvailable` | Number | Yes | Indexed | |
| `updatedAt` | Date | Yes | - | |

### `carts`
| Field | Type | Required | Key | Notes |
| --- | --- | --- | --- | --- |
| `_id` | ObjectId | Yes | PK | |
| `customerId` | ObjectId | Yes | Indexed | |
| `items` | Array<Object> | Yes | - | productId, qty, unitPrice |
| `updatedAt` | Date | Yes | - | |

### `orders`
| Field | Type | Required | Key | Notes |
| --- | --- | --- | --- | --- |
| `_id` | ObjectId | Yes | PK | |
| `customerId` | ObjectId | Yes | Indexed | |
| `orderNumber` | String | Yes | Candidate unique | |
| `status` | String enum | Yes | Indexed | `pendingPayment`, `paid`, `processing`, `shipped`, `delivered`, `cancelled`, `refunded` |
| `subtotal` | Number | Yes | - | |
| `shippingCost` | Number | Yes | - | |
| `tax` | Number | Yes | - | |
| `total` | Number | Yes | - | |
| `currency` | String | Yes | - | `USD` |
| `fulfillmentMode` | String enum | Yes | Indexed | `inHouse`, `thirdParty` |
| `shippingAddress` | Object | Yes | - | |
| `createdAt` | Date | Yes | Indexed | |
| `updatedAt` | Date | Yes | - | |

## 6) Payment and Trust Collections

### `payments`
| Field | Type | Required | Key | Notes |
| --- | --- | --- | --- | --- |
| `_id` | ObjectId | Yes | PK | |
| `payerUserId` | ObjectId | Yes | Indexed | |
| `bookingId` | ObjectId | No | Indexed | |
| `orderId` | ObjectId | No | Indexed | |
| `provider` | String | Yes | - | stripe etc |
| `providerIntentId` | String | Yes | Candidate unique | |
| `amount` | Number | Yes | - | |
| `currency` | String | Yes | - | `USD` |
| `status` | String enum | Yes | Indexed | `created`, `requiresAction`, `succeeded`, `failed`, `refunded` |
| `createdAt` | Date | Yes | Indexed | |
| `updatedAt` | Date | Yes | - | |

### `reviews`
| Field | Type | Required | Key | Notes |
| --- | --- | --- | --- | --- |
| `_id` | ObjectId | Yes | PK | |
| `bookingId` | ObjectId | Yes | Unique | one review per booking |
| `customerId` | ObjectId | Yes | Indexed | |
| `garageId` | ObjectId | Yes | Indexed | |
| `ratingOverall` | Number | Yes | - | 1-5 |
| `ratingPrice` | Number | No | - | 1-5 |
| `ratingQuality` | Number | No | - | 1-5 |
| `ratingTime` | Number | No | - | 1-5 |
| `ratingBehavior` | Number | No | - | 1-5 |
| `comment` | String | No | - | |
| `isVerified` | Boolean | Yes | Indexed | true only after completed booking |
| `createdAt` | Date | Yes | - | |

### `garage_badges`
| Field | Type | Required | Key | Notes |
| --- | --- | --- | --- | --- |
| `_id` | ObjectId | Yes | PK | |
| `garageId` | ObjectId | Yes | Indexed | |
| `badgeKey` | String enum | Yes | Indexed | `topRated`, `budgetFriendly`, `evSpecialist` |
| `active` | Boolean | Yes | Indexed | |
| `awardedAt` | Date | Yes | - | |

## 7) Notification Collections

### `notifications`
| Field | Type | Required | Key | Notes |
| --- | --- | --- | --- | --- |
| `_id` | ObjectId | Yes | PK | |
| `userId` | ObjectId | Yes | Indexed | |
| `channel` | String enum | Yes | Indexed | `sms`, `email`, `push`, `inApp` |
| `templateKey` | String | Yes | - | |
| `payload` | Object | No | - | |
| `status` | String enum | Yes | Indexed | `queued`, `sent`, `failed` |
| `createdAt` | Date | Yes | Indexed | |

## Global Index Notes
- Geo index: `garages.location` (2dsphere)
- Unique role mapping: `user_roles (userId, roleId)`
- Unique review rule: `reviews.bookingId`
- Optional sparse unique: `users.email`, `users.mobileNumber`

## PRD Constraint Notes
- No unsafe DIY suggestions for high-risk issues (`diagnosis_results`).
- Garage/vendor operations are approval-gated (`garages.approvalStatus`, `sellers.approvalStatus`).
- Payments are platform-controlled and auditable (`payments`).
- Reviews are verified and post-booking only (`reviews.isVerified`).
