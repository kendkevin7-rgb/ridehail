# Ride-Hailing Application — SPECIFICATION

> **Project**: Ride-Hailing Web Application  
> **Tech Stack**: React 18 + TypeScript + Vite (Frontend) | Node.js + Express + TypeScript (Backend) | PostgreSQL (Database)  
> **Status**: Draft Specification  

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Frontend Component Tree & Pages](#2-frontend-component-tree--pages)
3. [Data Model](#3-data-model)
4. [API Routes](#4-api-routes)
5. [State Management](#5-state-management)
6. [Data Flow Diagrams](#6-data-flow-diagrams)
7. [Edge Cases & States](#7-edge-cases--states)
8. [File Structure](#8-file-structure)
9. [Acceptance Criteria](#9-acceptance-criteria)

---

## 1. Architecture Overview

### 1.1 System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           CLIENT (Browser)                                  │
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                    React 18 + TypeScript + Vite                      │   │
│  │                                                                      │   │
│  │  ┌────────────┐  ┌──────────────────┐  ┌────────────────────────┐   │   │
│  │  │  Pages     │  │  Shared Components│  │     Contexts           │   │   │
│  │  │  (Rider/   │  │  (Button, Card,   │  │  (Auth, Rider, Driver, │   │   │
│  │  │   Driver/  │  │   Modal, Spinner, │  │   Ride, Payment)       │   │   │
│  │  │   Auth)    │  │   EmptyState...)  │  │                        │   │   │
│  │  └─────┬──────┘  └────────┬─────────┘  └───────────┬────────────┘   │   │
│  │        │                  │                        │                 │   │
│  │  ┌─────┴──────────────────┴────────────────────────┴────────────┐   │   │
│  │  │                    Services Layer                             │   │   │
│  │  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐   │   │   │
│  │  │  │  api.ts      │  │  socket.ts   │  │  helpers.ts      │   │   │   │
│  │  │  │  (Axios +    │  │  (Socket.IO  │  │  (utils, valid.  │   │   │   │
│  │  │  │   intercept) │  │   client)    │  │   geolocation)   │   │   │   │
│  │  │  └──────┬───────┘  └──────┬───────┘  └──────────────────┘   │   │   │
│  │  └─────────┼─────────────────┼─────────────────────────────────┘   │   │
│  └────────────┼─────────────────┼─────────────────────────────────────┘   │
│               │                 │                                         │
│         HTTPS │           WSS   │                                         │
│   (REST API)  │     (Socket.IO) │                                         │
└───────────────┼─────────────────┼─────────────────────────────────────────┘
                │                 │
┌───────────────┼─────────────────┼─────────────────────────────────────────┐
│               ▼                 ▼                                         │
│  ┌──────────────────────────────────────────────────────────────────┐     │
│  │                    BACKEND (Node.js + Express + TypeScript)      │     │
│  │                                                                  │     │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────────┐ │     │
│  │  │  Routes  │──│Middleware│──│ Services │──│     Models       │ │     │
│  │  │ (auth,   │  │ (auth,   │  │ (auth,   │  │ (raw SQL queries)│ │     │
│  │  │  rider,  │  │  error,  │  │  ride,   │  │                  │ │     │
│  │  │  driver, │  │  upload, │  │  payment,│  │                  │ │     │
│  │  │  ride,   │  │  validate│  │  socket) │  │                  │ │     │
│  │  │  payment)│  │          │  │          │  │                  │ │     │
│  │  └──────────┘  └──────────┘  └──────────┘  └────────┬─────────┘ │     │
│  │                                                     │           │     │
│  │  ┌──────────────────────────────────────────────────┴─────────┐ │     │
│  │  │                    PostgreSQL Database                      │ │     │
│  │  │  users │ riders │ drivers │ driver_documents │ vehicles     │ │     │
│  │  │  rides │ ride_status_log │ payment_methods │ payments      │ │     │
│  │  │  refresh_tokens                                              │ │     │
│  │  └────────────────────────────────────────────────────────────┘ │     │
│  └──────────────────────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 1.2 Layers

| Layer | Responsibility |
|---|---|
| **Frontend Pages** | Route-matched page components, composition of UI blocks |
| **Frontend Contexts** | Global state via React Context + useReducer for auth, rides, payments |
| **Frontend Services** | Axios instance (with JWT interceptor), Socket.IO client, utility functions |
| **API Routes** | Express Router — thin controllers that validate input and delegate to services |
| **Middleware** | JWT verification, file upload (multer), request validation (zod), error handler |
| **Services** | Business logic, transaction coordination, external integrations (Stripe) |
| **Models** | Raw SQL query functions — no ORM. Each model file exports query functions |
| **Database** | PostgreSQL 15+ with GIS extension (PostGIS) for location queries |

### 1.3 Authentication Flow

```
┌──────────┐         ┌──────────┐         ┌──────────┐
│  Client  │         │  Server  │         │    DB    │
└────┬─────┘         └────┬─────┘         └────┬─────┘
     │                    │                    │
     │  POST /auth/login  │                    │
     │  {email, password} │                    │
     │───────────────────>│                    │
     │                    │  SELECT * FROM     │
     │                    │  users WHERE email │
     │                    │───────────────────>│
     │                    │<───────────────────│
     │                    │                    │
     │                    │  bcrypt.compare()  │
     │                    │  sign access_token │
     │                    │  sign refresh_token│
     │                    │  INSERT INTO       │
     │                    │  refresh_tokens    │
     │                    │───────────────────>│
     │                    │<───────────────────│
     │  {access_token,    │                    │
     │   refresh_token,   │                    │
     │   user}            │                    │
     │<───────────────────│                    │
     │                    │                    │
     │  [Stores access_token in memory,        │
     │   refresh_token in httpOnly cookie]     │
     │                    │                    │
     │  GET /riders/profile                    │
     │  Authorization: Bearer <access_token>   │
     │───────────────────>│                    │
     │   [If expired]     │                    │
     │<─── 401 ──────────│                    │
     │                    │                    │
     │  POST /auth/refresh                     │
     │  Cookie: refresh_token                  │
     │───────────────────>│                    │
     │                    │ Verify refresh,    │
     │                    │ issue new pair     │
     │<─── new tokens ───│                    │
     │                    │                    │
     │  Retry original    │                    │
     │  request with new  │                    │
     │  access_token      │                    │
     │───────────────────>│                    │
     │<─── 200/201 ──────│                    │
```

### 1.4 Real-Time (Socket.IO) Architecture

```
┌──────────┐                     ┌──────────┐
│  Rider   │                     │  Driver  │
│  Client  │                     │  Client  │
└────┬─────┘                     └────┬─────┘
     │                                │
     │  connect()                     │  connect()
     │  namespace: /ride-tracking    │  namespace: /ride-tracking
     │────────────────>              │<───────────────
     │                  │            │
     │         ┌────────┴────────┐   │
     │         │  Socket.IO      │   │
     │         │  Server         │   │
     │         │  (Express +     │   │
     │         │   Node.js)      │   │
     │         └────────┬────────┘   │
     │                  │            │
     │  emit:            │           │  emit:
     │  requestRide     │           │  driverLocationUpdate
     │<─────────────────│───────────│─ (every 3s)
     │                  │           │
     │  emit to driver: │           │
     │  newRideRequest  │──────────>│
     │                  │           │
     │                  │  emit:    │
     │                  │  rideAccepted
     │<─────────────────│───────────│
     │                  │           │
     │  emit:            │           │
     │  rideStatusChanged           │
     │<─────────────────│───────────│
```

### 1.5 Payment Flow (Stripe Simulated)

```
┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│  Client  │     │  Server  │     │  Stripe  │     │    DB    │
└────┬─────┘     └────┬─────┘     └────┬─────┘     └────┬─────┘
     │                │                │                │
     │ add card       │                │                │
     │ (Stripe.js     │                │                │
     │  Elements)     │                │                │
     │────────────────────────────────>│                │
     │<── token ───────────────────────│                │
     │                │                │                │
     │ POST /payments/methods          │                │
     │ {stripe_token} │                │                │
     │───────────────>│                │                │
     │                │  stripe.       │                │
     │                │  paymentMethods│                │
     │                │  .create()     │                │
     │                │───────────────>│                │
     │                │<───────────────│                │
     │                │  INSERT INTO   │                │
     │                │  payment_methods               │
     │                │───────────────>│                │
     │<── 201 ───────│                │                │
     │                │                │                │
     │ [Ride completes]                │                │
     │                │                │                │
     │ POST /payments │                │                │
     │ /create-intent │                │                │
     │ {ride_id}      │                │                │
     │───────────────>│                │                │
     │                │  stripe.       │                │
     │                │  paymentIntents│                │
     │                │  .create()     │                │
     │                │───────────────>│                │
     │                │<───────────────│                │
     │<── client_secret───────────────│                │
     │                │                │                │
     │ stripe.confirmCardPayment()    │                │
     │────────────────────────────────>│                │
     │<── confirmed ──────────────────│                │
     │                │                │                │
     │ POST /payments │                │                │
     │ /confirm       │                │                │
     │ {payment_intent_id, ride_id}   │                │
     │───────────────>│                │                │
     │                │  UPDATE rides  │                │
     │                │  SET status =  │                │
     │                │  'completed'   │                │
     │                │  INSERT INTO   │                │
     │                │  payments      │                │
     │                │───────────────>│                │
     │<── 200 ───────│                │                │
```

---

## 2. Frontend Component Tree & Pages

### 2.1 Complete Component Tree

```
<App>
  <ToastProvider>                          // Global toast notifications
    <AuthProvider>                          // Auth state, tokens, user
      <SocketProvider>                      // Socket.IO connection lifecycle
        <RiderProvider>                     // Rider-specific state
          <DriverProvider>                  // Driver-specific state
            <RideProvider>                  // Active ride, history, nearby drivers
              <PaymentProvider>             // Payment methods, history
                <Router>
                  ├── <AuthLayout>
                  │   ├── <LoginPage />
                  │   │   ├── <Card>
                  │   │   │   ├── <Input label="Email" type="email" />
                  │   │   │   ├── <Input label="Password" type="password" />
                  │   │   │   ├── <Button variant="primary">Sign In</Button>
                  │   │   │   ├── <Button variant="text">Forgot Password?</Button>
                  │   │   │   └── <Link to="/register">Create Account</Link>
                  │   │   └── <ErrorBanner />          // Shown on 401, network error
                  │   └── <RegisterPage />
                  │       └── <Card>
                  │           ├── <Input label="Full Name" />
                  │           ├── <Input label="Email" />
                  │           ├── <Input label="Phone" />
                  │           ├── <Input label="Password" />
                  │           ├── <Input label="Confirm Password" />
                  │           ├── <RadioGroup name="role" options={rider|driver} />
                  │           └── <Button variant="primary">Create Account</Button>
                  │
                  ├── <RiderLayout>                    // Bottom nav: Home, Book, History, Profile
                  │   ├── <BottomNav items={riderNavItems} />
                  │   ├── <Header title="RideNow" />
                  │   │
                  │   ├── <HomePage />
                  │   │   ├── <QuickActionsCard />
                  │   │   │   ├── <Button>Book a Ride</Button>
                  │   │   │   └── <Button>Schedule</Button>
                  │   │   ├── <ActiveRideCard />       // Shown when ride is active
                  │   │   └── <RecentRidesPreview />   // Last 3 rides
                  │   │       └── <RideStatusCard /> (×3)
                  │   │
                  │   ├── <BookRidePage />
                  │   │   ├── <MapView />               // Leaflet/Mapbox
                  │   │   │   ├── <PickupMarker />      // Draggable
                  │   │   │   ├── <DropoffMarker />     // Draggable
                  │   │   │   └── <DriverMarker />      // Live driver location
                  │   │   ├── <LocationSearch />
                  │   │   │   ├── <Input placeholder="Pickup location" />
                  │   │   │   └── <Dropdown suggestions />
                  │   │   ├── <VehicleTypeSelector />
                  │   │   │   ├── <VehicleTypeCard type="standard" price="$5-8" />
                  │   │   │   ├── <VehicleTypeCard type="premium" price="$10-15" />
                  │   │   │   └── <VehicleTypeCard type="xl" price="$15-25" />
                  │   │   ├── <FareEstimateCard />     // Shown after route calc
                  │   │   ├── <NearbyDriversCount />    // "5 drivers nearby"
                  │   │   ├── <Button variant="primary">Request Ride</Button>
                  │   │   └── <RideRequestStatus />    // Searching... / Driver Found / No Drivers
                  │   │       ├── <Spinner />
                  │   │       ├── <DriverFoundCard>
                  │   │       │   ├── <DriverInfo name, photo, rating />
                  │   │       │   ├── <DriverETA />
                  │   │       │   └── <Button variant="danger">Cancel Request</Button>
                  │   │       └── <NoDriversCard>
                  │   │           ├── <Icon type="sad" />
                  │   │           └── <Button variant="outline">Try Again</Button>
                  │   │
                  │   ├── <RideHistoryPage />
                  │   │   ├── <FilterBar />
                  │   │   │   ├── <Button filter="all">All</Button>
                  │   │   │   ├── <Button filter="completed">Completed</Button>
                  │   │   │   └── <Button filter="cancelled">Cancelled</Button>
                  │   │   ├── <RideHistoryList />
                  │   │   │   ├── <RideHistoryCard /> (×N)
                  │   │   │   │   ├── <RouteSummary pickup→dropoff />
                  │   │   │   │   ├── <DriverInfo compact />
                  │   │   │   │   ├── <FareDisplay />
                  │   │   │   │   ├── <RideDate />
                  │   │   │   │   └── <StatusBadge />
                  │   │   │   └── <InfiniteScrollTrigger />
                  │   │   ├── <EmptyState icon="car" title="No rides yet" action="Book your first ride" />
                  │   │   ├── <ErrorState message="Failed to load rides" onRetry={refetch} />
                  │   │   └── <Spinner />              // Full-page loading
                  │   │
                  │   ├── <ProfilePage />
                  │   │   ├── <AvatarUpload />
                  │   │   ├── <ProfileForm>
                  │   │   │   ├── <Input label="Full Name" />
                  │   │   │   ├── <Input label="Email" disabled />
                  │   │   │   ├── <Input label="Phone" />
                  │   │   │   ├── <Input label="Default Pickup Location" />
                  │   │   │   └── <Button variant="primary">Save Changes</Button>
                  │   │   ├── <Button variant="text">Change Password</Button>
                  │   │   └── <Button variant="danger">Logout</Button>
                  │   │
                  │   └── <PaymentMethodsPage />
                  │       ├── <PaymentMethodList />
                  │       │   ├── <PaymentMethodCard /> (×N)
                  │       │   │   ├── <Icon cardBrandIcon />
                  │       │   │   ├── <span>•••• {last4}</span>
                  │       │   │   ├── <Badge>Default</Badge>
                  │       │   │   └── <Button icon="trash" />
                  │       │   └── <Spinner />
                  │       ├── <EmptyState icon="credit-card" title="No payment methods" action="Add a card" />
                  │       ├── <AddCardForm>
                  │       │   ├── <CardElement />       // Stripe Elements
                  │       │   └── <Button variant="primary">Add Card</Button>
                  │       └── <ErrorState />
                  │
                  ├── <DriverLayout>                   // Bottom nav: Dashboard, Verification, Requests, Earnings, Profile
                  │   ├── <BottomNav items={driverNavItems} />
                  │   ├── <Header title="Driver Hub" />
                  │   │
                  │   ├── <DriverDashboardPage />
                  │   │   ├── <StatusToggle />          // Online/Offline toggle
                  │   │   ├── <EarningsSummary>
                  │   │   │   ├── <StatCard label="Today" value="$45" />
                  │   │   │   ├── <StatCard label="Week" value="$320" />
                  │   │   │   └── <StatCard label="Trips" value="12" />
                  │   │   ├── <ActiveRideCard />        // Shown when on a ride
                  │   │   │   ├── <RiderInfo />
                  │   │   │   ├── <NavigationButton />  // Opens maps
                  │   │   │   └── <RideActions />       // "Arrived", "Start Trip", "Complete"
                  │   │   └── <RecentTripsPreview />
                  │   │
                  │   ├── <VerificationPage />
                  │   │   ├── <VerificationStatusBanner />
                  │   │   │   ├── <StatusPending>
                  │   │   │   │   ├── <Icon hourglass />
                  │   │   │   │   └── <p>Your documents are under review</p>
                  │   │   │   ├── <StatusApproved>
                  │   │   │   │   ├── <Icon checkmark />
                  │   │   │   │   └── <p>You are verified! Start accepting rides.</p>
                  │   │   │   └── <StatusRejected>
                  │   │   │       ├── <Icon warning />
                  │   │   │       ├── <p>Document rejected: {reason}</p>
                  │   │   │       └── <Button>Re-upload</Button>
                  │   │   ├── <DocumentUploadSection>
                  │   │   │   ├── <UploadZone label="Driver's License" />
                  │   │   │   ├── <UploadZone label="Vehicle Insurance" />
                  │   │   │   ├── <UploadZone label="Vehicle Registration" />
                  │   │   │   ├── <UploadZone label="Profile Photo" />
                  │   │   │   └── <Button variant="primary">Submit Documents</Button>
                  │   │   └── <VehicleInfoForm>
                  │   │       ├── <Input label="Make" />
                  │   │       ├── <Input label="Model" />
                  │   │       ├── <Input label="Year" type="number" />
                  │   │       ├── <Input label="Color" />
                  │   │       ├── <Input label="Plate Number" />
                  │   │       └── <Select label="Vehicle Type" options={standard/premium/xl} />
                  │   │
                  │   ├── <RideRequestsPage />
                  │   │   ├── <IncomingRequestCard />  // Animated, shown when ride is offered
                  │   │   │   ├── <RiderPickupDistance />
                  │   │   │   ├── <RoutePreview />
                  │   │   │   ├── <FareEstimate />
                  │   │   │   ├── <CountdownTimer seconds={15} />
                  │   │   │   ├── <Button variant="primary">Accept</Button>
                  │   │   │   └── <Button variant="danger">Decline</Button>
                  │   │   ├── <ActiveRideCard />
                  │   │   │   ├── <RiderInfo />
                  │   │   │   ├── <RideProgress />     // Steps: Arrived → On Ride → Complete
                  │   │   │   ├── <ActionButton />     // Context-dependent
                  │   │   │   └── <CancelRideButton />
                  │   │   └── <EmptyState icon="inbox" title="No ride requests" />
                  │   │
                  │   ├── <DriverEarningsPage />
                  │   │   ├── <EarningsChart />         // Weekly bar chart
                  │   │   ├── <DateRangeFilter />
                  │   │   ├── <EarningsList>
                  │   │   │   └── <EarningsRow /> (×N)
                  │   │   │       ├── <RideDate />
                  │   │   │       ├── <FareAmount />
                  │   │   │       ├── <TipAmount />
                  │   │   │       └── <PlatformFee />
                  │   │   └── <PayoutSummary />
                  │   │
                  │   └── <DriverProfilePage />
                  │       ├── <DriverPhoto />
                  │       ├── <RatingDisplay />
                  │       ├── <ProfileForm>
                  │       │   ├── <Input label="Full Name" />
                  │       │   ├── <Input label="Phone" />
                  │       │   └── <Button variant="primary">Save</Button>
                  │       ├── <VehicleInfoDisplay editLink />
                  │       ├── <Button variant="text">Change Password</Button>
                  │       └── <Button variant="danger">Logout</Button>
                  │
                  └── <NotFoundPage />
                      └── <ErrorState code="404" message="Page not found" />
                </Router>
              </PaymentProvider>
            </RideProvider>
          </DriverProvider>
        </RiderProvider>
      </SocketProvider>
    </AuthProvider>
  </ToastProvider>
</App>
```

### 2.2 Shared Components Specification

#### `Button`
| Prop | Type | Default | Description |
|---|---|---|---|
| `variant` | `'primary' \| 'secondary' \| 'danger' \| 'outline' \| 'text'` | `'primary'` | Visual style |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Size |
| `loading` | `boolean` | `false` | Show spinner + disable |
| `disabled` | `boolean` | `false` | Disabled state |
| `fullWidth` | `boolean` | `false` | Width 100% |
| `icon` | `ReactNode` | — | Icon slot |
| `children` | `ReactNode` | — | Label |
| States: loading (spinner + disabled), disabled (greyed, no pointer), normal, hover, active, focus |

#### `Input`
| Prop | Type | Default | Description |
|---|---|---|---|
| `label` | `string` | — | Floating/stacked label |
| `type` | `'text' \| 'email' \| 'password' \| 'tel' \| 'number'` | `'text'` | HTML input type |
| `error` | `string` | — | Validation error message |
| `hint` | `string` | — | Helper text below input |
| `icon` | `ReactNode` | — | Leading icon |
| States: normal, focused, filled, error (red border + message), disabled (greyed), readonly |

#### `Card`
| Prop | Type | Default | Description |
|---|---|---|---|
| `padding` | `'none' \| 'sm' \| 'md' \| 'lg'` | `'md'` | Padding |
| `shadow` | `'none' \| 'sm' \| 'md' \| 'lg'` | `'sm'` | Shadow depth |
| `onClick` | `() => void` | — | Click handler (makes card interactive) |

#### `Modal`
| Prop | Type | Default | Description |
|---|---|---|---|
| `isOpen` | `boolean` | required | Control visibility |
| `onClose` | `() => void` | required | Close callback |
| `title` | `string` | — | Modal title |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Max-width |
| `closeOnOverlay` | `boolean` | `true` | Click overlay to close |
| Children rendered as body, footer slot via `Modal.Footer` |
| States: open (animate in + backdrop), closed, closing (animate out) |

#### `Spinner`
| Prop | Type | Default | Description |
|---|---|---|---|
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Size of the spinner |
| `overlay` | `boolean` | `false` | Full-page overlay with backdrop |
| `label` | `string` | `'Loading...'` | Screen-reader text |

#### `EmptyState`
| Prop | Type | Default | Description |
|---|---|---|---|
| `icon` | `string` | — | Icon name or ReactNode |
| `title` | `string` | required | Heading text |
| `description` | `string` | — | Subtitle |
| `action` | `{ label: string; onClick: () => void }` | — | CTA button |

#### `ErrorState`
| Prop | Type | Default | Description |
|---|---|---|---|
| `message` | `string` | `'Something went wrong'` | Error text |
| `code` | `string` | — | Error code (e.g., 404, 500) |
| `onRetry` | `() => void` | — | Retry button handler |
| `fullPage` | `boolean` | `true` | Center in viewport |

#### `Toast`
| Prop | Type | Default | Description |
|---|---|---|---|
| `type` | `'success' \| 'error' \| 'info' \| 'warning'` | `'info'` | Toast variant |
| `message` | `string` | required | Message text |
| `duration` | `number` | `5000` | Auto-dismiss ms (0 = sticky) |
| `position` | `'top-right' \| 'top-center' \| 'bottom-center'` | `'top-right'` | Screen position |

#### `BottomNav`
| Prop | Type | Default | Description |
|---|---|---|---|
| `items` | `Array<{ label: string; icon: ReactNode; path: string; badge?: number }>` | required | Nav items |
| Active item highlighted, badge shown for unread count (e.g., ride requests) |

#### `ProtectedRoute`
| Prop | Type | Default | Description |
|---|---|---|---|
| `role` | `'rider' \| 'driver'` | required | Required role |
| `fallback` | `string` | `'/login'` | Redirect if unauthenticated |
| Renders children if authenticated + role matches. Renders `<ForbiddenPage />` if wrong role. |

#### `RideStatusCard`
| Prop | Type | Default | Description |
|---|---|---|---|
| `ride` | `Ride` | required | Ride data |
| `compact` | `boolean` | `false` | Compact variant for lists |
| States: pending, searching, accepted, arrived, in_progress, completed, cancelled, driver_cancelled |

### 2.3 Page State Matrix

Every page handles these states:

| State | Implementation |
|---|---|
| **Loading** | Full-page `<Spinner overlay />` or inline skeleton cards |
| **Empty** | `<EmptyState>` with icon, message, and CTA button |
| **Error** | `<ErrorState>` with retry button that re-fetches data |
| **Offline** | Persistent banner at top: "You are offline. Some features may be unavailable." |
| **Success** | Normal rendered content |
| **Partial data** | grace under failures — if ride history loads but one ride fails, show that ride as errored inline |

---

## 3. Data Model

### 3.1 Entity-Relationship Diagram

```
┌─────────────┐       ┌──────────────────┐
│    users    │       │  refresh_tokens  │
├─────────────┤       ├──────────────────┤
│ id (PK)     │──┐    │ id (PK)          │
│ email (UQ)  │  │    │ user_id (FK)     │──┐
│ phone (UQ)  │  │    │ token (UQ)       │  │
│ password_hash│ │    │ expires_at       │  │
│ full_name   │  │    │ created_at       │  │
│ role        │  │    └──────────────────┘  │
│ avatar_url  │  │                          │
│ created_at  │  │                          │
│ updated_at  │  │                          │
└─────────────┘  │                          │
                 │                          │
    ┌────────────┘                          │
    ▼                                       │
┌─────────────┐    ┌─────────────────┐      │
│   riders    │    │    drivers      │      │
├─────────────┤    ├─────────────────┤      │
│ id (PK)     │    │ id (PK)         │      │
│ user_id (FK)│    │ user_id (FK)    │      │
│ rating      │    │ license_number  │      │
│ ride_count  │    │ is_verified     │      │
│ created_at  │    │ current_loc(GEOM)│     │
└─────────────┘    │ status (online/ │      │
                   │   offline/busy) │      │
                   │ rating          │      │
                   │ ride_count      │      │
                   │ created_at      │      │
                   └────────┬────────┘      │
                            │               │
              ┌─────────────┼──────────┐    │
              ▼             ▼          │    │
   ┌────────────────┐ ┌──────────┐     │    │
   │driver_documents│ │ vehicles │     │    │
   ├────────────────┤ ├──────────┤     │    │
   │ id (PK)        │ │ id (PK)  │     │    │
   │ driver_id (FK) │ │driver_id │     │    │
   │ type           │ │ make     │     │    │
   │ file_url       │ │ model    │     │    │
   │ status         │ │ year     │     │    │
   │ admin_comment  │ │ color    │     │    │
   │ uploaded_at    │ │ plate_no │     │    │
   │ reviewed_at    │ │ type     │     │    │
   └────────────────┘ │ is_active│     │    │
                      └──────────┘     │    │
                                       │    │
         ┌─────────────────────────────┘    │
         ▼                                  │
    ┌──────────┐                            │
    │   rides  │                            │
    ├──────────┤                            │
    │ id (PK)  │                            │
    │ rider_id │── FK → riders.id           │
    │ driver_id│── FK → drivers.id          │
    │ pickup_loc (GEOM)                     │
    │ dropoff_loc (GEOM)                    │
    │ pickup_address                         │
    │ dropoff_address                        │
    │ status                                │
    │ vehicle_type                           │
    │ fare                                  │
    │ distance_km                            │
    │ duration_min                           │
    │ payment_status                        │
    │ created_at                            │
    │ accepted_at                           │
    │ started_at                            │
    │ completed_at                          │
    │ cancelled_at                          │
    │ cancel_reason                         │
    └────┬─────┘                            │
         │                                  │
         ├──────────────────────────────┐   │
         ▼                              ▼   │
┌──────────────────┐          ┌──────────┐  │
│ ride_status_log  │          │ payments │  │
├──────────────────┤          ├──────────┤  │
│ id (PK)          │          │ id (PK)  │  │
│ ride_id (FK)     │──┐       │ ride_id  │──┘
│ status           │  │       │ rider_id │── FK → riders.id
│ location (GEOM)  │  │       │ driver_id│── FK → drivers.id
│ timestamp        │  │       │ amount   │
└──────────────────┘  │       │ platform_fee
                      │       │ tip      │
┌──────────────────┐  │       │ stripe_payment_intent_id
│ payment_methods  │  │       │ status   │
├──────────────────┤  │       │ created_at│
│ id (PK)          │  │       └──────────┘
│ user_id (FK)     │──┘
│ stripe_pm_id     │
│ card_last4       │
│ card_brand       │
│ exp_month        │
│ exp_year         │
│ is_default       │
│ created_at       │
└──────────────────┘
```

### 3.2 Table Definitions

#### `users`
| Column | Type | Constraints | Default | Description |
|---|---|---|---|---|
| `id` | `UUID` | `PRIMARY KEY DEFAULT gen_random_uuid()` | — | Unique user identifier |
| `email` | `VARCHAR(255)` | `NOT NULL UNIQUE` | — | Login email |
| `phone` | `VARCHAR(20)` | `NOT NULL UNIQUE` | — | Phone number |
| `password_hash` | `VARCHAR(255)` | `NOT NULL` | — | bcrypt hash |
| `full_name` | `VARCHAR(100)` | `NOT NULL` | — | Display name |
| `role` | `VARCHAR(10)` | `NOT NULL CHECK (role IN ('rider', 'driver'))` | — | User role |
| `avatar_url` | `TEXT` | — | `NULL` | Profile photo URL |
| `is_active` | `BOOLEAN` | `NOT NULL DEFAULT true` | `true` | Soft delete flag |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT NOW()` | — | |
| `updated_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT NOW()` | — | |

Indexes:
- `idx_users_email` ON `email`
- `idx_users_phone` ON `phone`

#### `riders`
| Column | Type | Constraints | Default | Description |
|---|---|---|---|---|
| `id` | `UUID` | `PRIMARY KEY DEFAULT gen_random_uuid()` | — | |
| `user_id` | `UUID` | `NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE` | — | |
| `default_pickup_lat` | `DECIMAL(10,7)` | — | `NULL` | Saved pickup latitude |
| `default_pickup_lng` | `DECIMAL(10,7)` | — | `NULL` | Saved pickup longitude |
| `default_pickup_address` | `TEXT` | — | `NULL` | Saved address text |
| `rating` | `DECIMAL(2,1)` | `CHECK (rating >= 1.0 AND rating <= 5.0)` | `5.0` | Average rating |
| `ride_count` | `INTEGER` | `NOT NULL DEFAULT 0` | `0` | Total rides taken |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT NOW()` | — | |

#### `drivers`
| Column | Type | Constraints | Default | Description |
|---|---|---|---|---|
| `id` | `UUID` | `PRIMARY KEY DEFAULT gen_random_uuid()` | — | |
| `user_id` | `UUID` | `NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE` | — | |
| `license_number` | `VARCHAR(50)` | `NOT NULL UNIQUE` | — | Driver's license ID |
| `license_expiry` | `DATE` | `NOT NULL` | — | License expiration |
| `is_verified` | `BOOLEAN` | `NOT NULL DEFAULT false` | `false` | Admin verification |
| `current_lat` | `DECIMAL(10,7)` | — | `NULL` | Last known latitude |
| `current_lng` | `DECIMAL(10,7)` | — | `NULL` | Last known longitude |
| `status` | `VARCHAR(10)` | `NOT NULL DEFAULT 'offline' CHECK (status IN ('online', 'offline', 'busy'))` | `'offline'` | Availability |
| `rating` | `DECIMAL(2,1)` | `CHECK (rating >= 1.0 AND rating <= 5.0)` | `5.0` | Average rating |
| `ride_count` | `INTEGER` | `NOT NULL DEFAULT 0` | `0` | Total rides completed |
| `total_earnings` | `DECIMAL(10,2)` | `NOT NULL DEFAULT 0.00` | `0.00` | Lifetime earnings |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT NOW()` | — | |
| `updated_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT NOW()` | — | |

#### `driver_documents`
| Column | Type | Constraints | Default | Description |
|---|---|---|---|---|
| `id` | `UUID` | `PRIMARY KEY DEFAULT gen_random_uuid()` | — | |
| `driver_id` | `UUID` | `NOT NULL REFERENCES drivers(id) ON DELETE CASCADE` | — | |
| `type` | `VARCHAR(30)` | `NOT NULL CHECK (type IN ('license', 'insurance', 'registration', 'profile_photo'))` | — | Doc category |
| `file_url` | `TEXT` | `NOT NULL` | — | S3/cloud storage path |
| `file_name` | `VARCHAR(255)` | `NOT NULL` | — | Original filename |
| `mime_type` | `VARCHAR(50)` | `NOT NULL` | — | MIME type |
| `file_size` | `INTEGER` | `NOT NULL` | — | Size in bytes |
| `status` | `VARCHAR(10)` | `NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected'))` | `'pending'` | Verification status |
| `admin_comment` | `TEXT` | — | `NULL` | Rejection reason |
| `uploaded_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT NOW()` | — | |
| `reviewed_at` | `TIMESTAMPTZ` | — | `NULL` | When admin reviewed |

#### `vehicles`
| Column | Type | Constraints | Default | Description |
|---|---|---|---|---|
| `id` | `UUID` | `PRIMARY KEY DEFAULT gen_random_uuid()` | — | |
| `driver_id` | `UUID` | `NOT NULL UNIQUE REFERENCES drivers(id) ON DELETE CASCADE` | — | One driver = one registered vehicle |
| `make` | `VARCHAR(50)` | `NOT NULL` | — | e.g., Toyota |
| `model` | `VARCHAR(50)` | `NOT NULL` | — | e.g., Camry |
| `year` | `INTEGER` | `NOT NULL CHECK (year >= 2000 AND year <= EXTRACT(YEAR FROM NOW()) + 1)` | — | |
| `color` | `VARCHAR(30)` | `NOT NULL` | — | |
| `plate_number` | `VARCHAR(20)` | `NOT NULL UNIQUE` | — | License plate |
| `type` | `VARCHAR(10)` | `NOT NULL CHECK (type IN ('standard', 'premium', 'xl'))` | `'standard'` | Vehicle class |
| `capacity` | `INTEGER` | `NOT NULL DEFAULT 4` | `4` | Passenger capacity |
| `is_active` | `BOOLEAN` | `NOT NULL DEFAULT true` | `true` | Soft delete |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT NOW()` | — | |
| `updated_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT NOW()` | — | |

#### `rides`
| Column | Type | Constraints | Default | Description |
|---|---|---|---|---|
| `id` | `UUID` | `PRIMARY KEY DEFAULT gen_random_uuid()` | — | |
| `rider_id` | `UUID` | `NOT NULL REFERENCES riders(id)` | — | |
| `driver_id` | `UUID` | `REFERENCES drivers(id)` | `NULL` | Assigned driver (null until accepted) |
| `pickup_lat` | `DECIMAL(10,7)` | `NOT NULL` | — | |
| `pickup_lng` | `DECIMAL(10,7)` | `NOT NULL` | — | |
| `pickup_address` | `TEXT` | `NOT NULL` | — | Human-readable address |
| `dropoff_lat` | `DECIMAL(10,7)` | `NOT NULL` | — | |
| `dropoff_lng` | `DECIMAL(10,7)` | `NOT NULL` | — | |
| `dropoff_address` | `TEXT` | `NOT NULL` | — | |
| `status` | `VARCHAR(20)` | `NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'searching', 'accepted', 'arrived', 'in_progress', 'completed', 'cancelled'))` | `'pending'` | Current state |
| `vehicle_type` | `VARCHAR(10)` | `NOT NULL DEFAULT 'standard' CHECK (vehicle_type IN ('standard', 'premium', 'xl'))` | `'standard'` | Requested type |
| `fare` | `DECIMAL(10,2)` | — | `NULL` | Final fare |
| `estimated_fare` | `DECIMAL(10,2)` | — | `NULL` | Estimate shown on request |
| `distance_km` | `DECIMAL(6,2)` | — | `NULL` | Trip distance |
| `duration_min` | `INTEGER` | — | `NULL` | Trip duration |
| `payment_status` | `VARCHAR(15)` | `NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'processing', 'paid', 'failed', 'refunded'))` | `'pending'` | |
| `cancelled_by` | `VARCHAR(10)` | `CHECK (cancelled_by IN ('rider', 'driver', 'system'))` | `NULL` | Who cancelled |
| `cancel_reason` | `TEXT` | — | `NULL` | Reason for cancellation |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT NOW()` | — | |
| `accepted_at` | `TIMESTAMPTZ` | — | `NULL` | |
| `arrived_at` | `TIMESTAMPTZ` | — | `NULL` | |
| `started_at` | `TIMESTAMPTZ` | — | `NULL` | |
| `completed_at` | `TIMESTAMPTZ` | — | `NULL` | |
| `cancelled_at` | `TIMESTAMPTZ` | — | `NULL` | |

Indexes:
- `idx_rides_rider` ON `rider_id`
- `idx_rides_driver` ON `driver_id`
- `idx_rides_status` ON `status`
- `idx_rides_created` ON `created_at`

#### `ride_status_log`
| Column | Type | Constraints | Default | Description |
|---|---|---|---|---|
| `id` | `UUID` | `PRIMARY KEY DEFAULT gen_random_uuid()` | — | |
| `ride_id` | `UUID` | `NOT NULL REFERENCES rides(id) ON DELETE CASCADE` | — | |
| `status` | `VARCHAR(20)` | `NOT NULL` | — | Status at this point |
| `lat` | `DECIMAL(10,7)` | — | `NULL` | Location at time of change |
| `lng` | `DECIMAL(10,7)` | — | `NULL` | |
| `timestamp` | `TIMESTAMPTZ` | `NOT NULL DEFAULT NOW()` | — | |

#### `payment_methods`
| Column | Type | Constraints | Default | Description |
|---|---|---|---|---|
| `id` | `UUID` | `PRIMARY KEY DEFAULT gen_random_uuid()` | — | |
| `user_id` | `UUID` | `NOT NULL REFERENCES users(id) ON DELETE CASCADE` | — | |
| `stripe_payment_method_id` | `VARCHAR(255)` | `NOT NULL UNIQUE` | — | Stripe PM ID |
| `card_last4` | `VARCHAR(4)` | `NOT NULL` | — | |
| `card_brand` | `VARCHAR(20)` | `NOT NULL` | — | visa, mastercard, amex, etc. |
| `exp_month` | `INTEGER` | `NOT NULL` | — | |
| `exp_year` | `INTEGER` | `NOT NULL` | — | |
| `is_default` | `BOOLEAN` | `NOT NULL DEFAULT false` | `false` | Default payment method |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT NOW()` | — | |

#### `payments`
| Column | Type | Constraints | Default | Description |
|---|---|---|---|---|
| `id` | `UUID` | `PRIMARY KEY DEFAULT gen_random_uuid()` | — | |
| `ride_id` | `UUID` | `NOT NULL UNIQUE REFERENCES rides(id)` | — | One payment per ride |
| `rider_id` | `UUID` | `NOT NULL REFERENCES riders(id)` | — | |
| `driver_id` | `UUID` | `REFERENCES drivers(id)` | `NULL` | |
| `amount` | `DECIMAL(10,2)` | `NOT NULL` | — | Total charged |
| `base_fare` | `DECIMAL(10,2)` | `NOT NULL` | — | Base fare component |
| `distance_fare` | `DECIMAL(10,2)` | `NOT NULL` | — | Per-km charge |
| `time_fare` | `DECIMAL(10,2)` | `NOT NULL` | — | Per-minute charge |
| `platform_fee` | `DECIMAL(10,2)` | `NOT NULL DEFAULT 0` | `0` | Platform commission |
| `tip` | `DECIMAL(10,2)` | `NOT NULL DEFAULT 0` | `0` | Optional driver tip |
| `stripe_payment_intent_id` | `VARCHAR(255)` | `NOT NULL` | — | Stripe PI ID |
| `status` | `VARCHAR(15)` | `NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'succeeded', 'failed', 'refunded'))` | `'pending'` | |
| `failure_reason` | `TEXT` | — | `NULL` | Stripe failure message |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT NOW()` | — | |
| `paid_at` | `TIMESTAMPTZ` | — | `NULL` | |

Indexes:
- `idx_payments_rider` ON `rider_id`
- `idx_payments_driver` ON `driver_id`
- `idx_payments_ride` ON `ride_id`

#### `refresh_tokens`
| Column | Type | Constraints | Default | Description |
|---|---|---|---|---|
| `id` | `UUID` | `PRIMARY KEY DEFAULT gen_random_uuid()` | — | |
| `user_id` | `UUID` | `NOT NULL REFERENCES users(id) ON DELETE CASCADE` | — | |
| `token` | `VARCHAR(500)` | `NOT NULL UNIQUE` | — | JWT refresh token |
| `device_info` | `VARCHAR(255)` | — | `NULL` | User-agent / device info |
| `ip_address` | `INET` | — | `NULL` | |
| `is_revoked` | `BOOLEAN` | `NOT NULL DEFAULT false` | `false` | Manual revocation |
| `expires_at` | `TIMESTAMPTZ` | `NOT NULL` | — | |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT NOW()` | — | |

### 3.3 Enums Summary

```
UserRole       = 'rider' | 'driver'
DriverStatus   = 'online' | 'offline' | 'busy'
DocStatus      = 'pending' | 'approved' | 'rejected'
DocType        = 'license' | 'insurance' | 'registration' | 'profile_photo'
VehicleType    = 'standard' | 'premium' | 'xl'
RideStatus     = 'pending' | 'searching' | 'accepted' | 'arrived' | 'in_progress' | 'completed' | 'cancelled'
PaymentStatus  = 'pending' | 'processing' | 'paid' | 'failed' | 'refunded'
PaymentIntent  = 'pending' | 'processing' | 'succeeded' | 'failed' | 'refunded'
CancelledBy    = 'rider' | 'driver' | 'system'
```

---

## 4. API Routes

### 4.1 Auth Routes — `/api/auth`

#### `POST /api/auth/register`
- **Auth**: None
- **Request Body**:
```typescript
{
  email: string;           // valid email
  phone: string;           // E.164 format
  password: string;        // min 8, 1 upper, 1 number
  full_name: string;       // min 2, max 100
  role: 'rider' | 'driver';
}
```
- **Success Response** (201):
```typescript
{
  user: {
    id: string;
    email: string;
    phone: string;
    full_name: string;
    role: 'rider' | 'driver';
    created_at: string;
  };
  access_token: string;    // 15m expiry
  refresh_token: string;   // httpOnly cookie also set
}
```
- **Errors**: `409` email/phone taken, `400` validation failed

#### `POST /api/auth/login`
- **Auth**: None
- **Request Body**:
```typescript
{
  email: string;
  password: string;
}
```
- **Success Response** (200): Same shape as register
- **Errors**: `401` invalid credentials, `400` missing fields

#### `POST /api/auth/refresh`
- **Auth**: Cookie (refresh_token) or body `{ refresh_token: string }`
- **Success Response** (200):
```typescript
{
  access_token: string;
  refresh_token: string;
}
```
- **Errors**: `401` invalid/expired/revoked refresh token

#### `POST /api/auth/logout`
- **Auth**: Required (any role)
- **Request Body** (optional):
```typescript
{
  refresh_token?: string;  // if not provided, revoke all tokens for user
}
```
- **Success Response** (200): `{ message: 'Logged out successfully' }`
- **Errors**: `401` unauthorized

#### `PUT /api/auth/change-password`
- **Auth**: Required
- **Request Body**:
```typescript
{
  current_password: string;
  new_password: string;     // same validation as register
}
```
- **Success Response** (200): `{ message: 'Password updated' }`
- **Errors**: `400` weak password, `401` current password wrong

### 4.2 Rider Routes — `/api/riders`

#### `GET /api/riders/profile`
- **Auth**: Rider
- **Success Response** (200):
```typescript
{
  id: string;
  user: { id: string; email: string; phone: string; full_name: string; avatar_url: string | null };
  default_pickup_lat: number | null;
  default_pickup_lng: number | null;
  default_pickup_address: string | null;
  rating: number;
  ride_count: number;
  created_at: string;
}
```

#### `PUT /api/riders/profile`
- **Auth**: Rider
- **Request Body**:
```typescript
{
  full_name?: string;
  phone?: string;
  default_pickup_lat?: number;
  default_pickup_lng?: number;
  default_pickup_address?: string;
  avatar_url?: string;
}
```
- **Success Response** (200): Updated rider profile

#### `GET /api/riders/payment-methods`
- **Auth**: Rider
- **Success Response** (200):
```typescript
{
  payment_methods: Array<{
    id: string;
    card_last4: string;
    card_brand: string;
    exp_month: number;
    exp_year: number;
    is_default: boolean;
    created_at: string;
  }>;
}
```

#### `POST /api/riders/payment-methods`
- **Auth**: Rider
- **Request Body**:
```typescript
{
  stripe_payment_method_id: string;  // from Stripe.js Elements
}
```
- **Success Response** (201): Created payment method
- **Errors**: `400` invalid Stripe PM, `409` already exists

#### `DELETE /api/riders/payment-methods/:id`
- **Auth**: Rider
- **Success Response** (200): `{ message: 'Payment method removed' }`
- **Errors**: `404` not found, `400` cannot remove default (set new default first)

#### `PUT /api/riders/payment-methods/:id/default`
- **Auth**: Rider
- **Success Response** (200): Updated (unsets previous default)

### 4.3 Driver Routes — `/api/drivers`

#### `POST /api/drivers/register` (step 2 after user registration)
- **Auth**: Driver (user with role='driver' that has no driver profile yet)
- **Request Body**:
```typescript
{
  license_number: string;
  license_expiry: string;      // ISO date
  vehicle: {
    make: string;
    model: string;
    year: number;
    color: string;
    plate_number: string;
    type: 'standard' | 'premium' | 'xl';
  };
}
```
- **Success Response** (201):
```typescript
{
  driver: { id: string; is_verified: false; status: 'offline'; ... };
  vehicle: { id: string; ... };
}
```

#### `GET /api/drivers/profile`
- **Auth**: Driver
- **Success Response** (200):
```typescript
{
  id: string;
  license_number: string;
  license_expiry: string;
  is_verified: boolean;
  status: 'online' | 'offline' | 'busy';
  rating: number;
  ride_count: number;
  total_earnings: number;
  user: { id: string; email: string; phone: string; full_name: string; avatar_url: string | null };
  vehicle: {
    id: string;
    make: string;
    model: string;
    year: number;
    color: string;
    plate_number: string;
    type: string;
  } | null;
  documents: Array<{
    id: string;
    type: string;
    status: string;
    uploaded_at: string;
  }>;
  created_at: string;
}
```

#### `PUT /api/drivers/profile`
- **Auth**: Driver
- **Request Body**: `{ full_name?: string; phone?: string; avatar_url?: string }`
- **Success Response** (200): Updated driver profile

#### `POST /api/drivers/documents`
- **Auth**: Driver
- **Content-Type**: `multipart/form-data`
- **Fields**:
  - `file` — File (image/jpeg, image/png, application/pdf; max 10MB)
  - `type` — `'license' | 'insurance' | 'registration' | 'profile_photo'`
- **Success Response** (201):
```typescript
{
  id: string;
  type: string;
  status: 'pending';
  file_url: string;
  uploaded_at: string;
}
```
- **Errors**: `400` invalid type, `413` file too large, `415` unsupported format

#### `GET /api/drivers/documents`
- **Auth**: Driver
- **Success Response** (200):
```typescript
{
  documents: Array<{
    id: string;
    type: string;
    status: 'pending' | 'approved' | 'rejected';
    admin_comment: string | null;
    file_url: string;
    uploaded_at: string;
    reviewed_at: string | null;
  }>;
}
```

#### `PUT /api/drivers/vehicles`
- **Auth**: Driver
- **Request Body**:
```typescript
{
  make?: string;
  model?: string;
  year?: number;
  color?: string;
  plate_number?: string;
  type?: 'standard' | 'premium' | 'xl';
}
```
- **Success Response** (200): Updated vehicle

#### `PUT /api/drivers/status`
- **Auth**: Driver
- **Request Body**:
```typescript
{
  status: 'online' | 'offline';
}
```
- **Success Response** (200):
```typescript
{
  status: 'online' | 'offline';
}
```
- **Errors**: `400` if is_verified = false (can't go online), `400` if busy

#### `PUT /api/drivers/location`
- **Auth**: Driver (online)
- **Request Body**:
```typescript
{
  lat: number;
  lng: number;
}
```
- **Success Response** (200): `{ message: 'Location updated' }`
- **Note**: Client sends this every 3 seconds. Server broadcasts to nearby riders via Socket.IO.

#### `GET /api/drivers/earnings`
- **Auth**: Driver
- **Query Params**: `?from=2024-01-01&to=2024-12-31&page=1&limit=20`
- **Success Response** (200):
```typescript
{
  earnings: Array<{
    id: string;
    ride_id: string;
    amount: number;
    platform_fee: number;
    tip: number;
    payout: number;        // amount - platform_fee + tip
    created_at: string;
    pickup_address: string;
    dropoff_address: string;
  }>;
  summary: {
    total: number;
    platform_fees: number;
    tips: number;
    net_earnings: number;
    ride_count: number;
  };
  pagination: { page: number; limit: number; total: number; totalPages: number };
}
```

### 4.4 Admin Routes — `/api/admin`

#### `GET /api/admin/drivers/pending`
- **Auth**: Admin
- **Query Params**: `?page=1&limit=20`
- **Success Response** (200):
```typescript
{
  drivers: Array<{
    id: string;
    user: { full_name: string; email: string; phone: string };
    license_number: string;
    documents: Array<{ type: string; file_url: string; status: string; uploaded_at: string }>;
    created_at: string;
  }>;
  pagination: { page: number; limit: number; total: number; totalPages: number };
}
```

#### `PUT /api/admin/drivers/:id/verify`
- **Auth**: Admin
- **Request Body**:
```typescript
{
  action: 'approve' | 'reject';
  comment?: string;   // required if reject
}
```
- **Success Response** (200): `{ message: 'Driver verified', driver_id: string }`

#### `PUT /api/admin/drivers/:id/documents/:docId`
- **Auth**: Admin
- **Request Body**:
```typescript
{
  action: 'approve' | 'reject';
  comment?: string;
}
```
- **Success Response** (200): Document status updated

### 4.5 Ride Routes — `/api/rides`

#### `POST /api/rides`
- **Auth**: Rider
- **Request Body**:
```typescript
{
  pickup_lat: number;
  pickup_lng: number;
  pickup_address: string;
  dropoff_lat: number;
  dropoff_lng: number;
  dropoff_address: string;
  vehicle_type: 'standard' | 'premium' | 'xl';
}
```
- **Success Response** (201):
```typescript
{
  ride: {
    id: string;
    status: 'searching';
    estimated_fare: number;
    distance_km: number;
    duration_min: number;
    vehicle_type: string;
    pickup_address: string;
    dropoff_address: string;
    created_at: string;
  };
}
```
- **Errors**: `400` missing fields, `409` already have active ride

#### `GET /api/rides/nearby-drivers`
- **Auth**: Rider
- **Query Params**: `?lat=...&lng=...&radius=5` (km)
- **Success Response** (200):
```typescript
{
  count: number;
  drivers: Array<{
    id: string;
    lat: number;
    lng: number;
    vehicle: { type: string; make: string; model: string; color: string; plate_number: string };
    rating: number;
    distance_km: number;
  }>;
}
```
- **Note**: Only returns verified, online, not-busy drivers within radius

#### `GET /api/rides/:id`
- **Auth**: Rider or Driver (must be participant)
- **Success Response** (200): Full ride object with driver/rider info, status log
- **Errors**: `404`, `403` not participant

#### `GET /api/rides/history`
- **Auth**: Rider
- **Query Params**: `?page=1&limit=20&status=completed,cancelled&from=...&to=...`
- **Success Response** (200):
```typescript
{
  rides: Array<{
    id: string;
    pickup_address: string;
    dropoff_address: string;
    status: string;
    fare: number | null;
    distance_km: number;
    duration_min: number;
    driver?: { id: string; user: { full_name: string }; rating: number };
    created_at: string;
    completed_at?: string;
  }>;
  pagination: { page: number; limit: number; total: number; totalPages: number };
}
```

#### `PUT /api/rides/:id/cancel`
- **Auth**: Rider or Driver (must be participant)
- **Request Body**:
```typescript
{
  reason?: string;
}
```
- **Success Response** (200): Updated ride with status = 'cancelled'
- **Errors**: `400` ride already completed, `403` not participant, `404` not found
- **Business Rule**: Rider can cancel before driver arrives (up to 5 min after accept). Driver can cancel only before arrival with penalty tracking. After 5 min, rider is charged a cancellation fee.

#### `PUT /api/rides/:id/status`
- **Auth**: Driver (must be assigned)
- **Request Body**:
```typescript
{
  status: 'arrived' | 'in_progress' | 'completed';
  lat?: number;       // current location
  lng?: number;
}
```
- **Success Response** (200): Updated ride (creates ride_status_log entry)
- **Transition Rules**:
  - `accepted` → `arrived` (driver arrived at pickup)
  - `arrived` → `in_progress` (trip started)
  - `in_progress` → `completed` (trip ended, triggers fare calculation + payment)
- **Errors**: `400` invalid transition, `403` not assigned driver

#### `PUT /api/rides/:id/rate`
- **Auth**: Rider or Driver
- **Request Body**:
```typescript
{
  rating: number;  // 1-5
  comment?: string;
}
```
- **Success Response** (200): `{ message: 'Rating submitted' }`

### 4.6 Payment Routes — `/api/payments`

#### `POST /api/payments/create-intent`
- **Auth**: Rider
- **Request Body**:
```typescript
{
  ride_id: string;
  payment_method_id: string;  // the stored PM id
}
```
- **Success Response** (200):
```typescript
{
  client_secret: string;       // Stripe client secret
  payment_intent_id: string;
  amount: number;
}
```
- **Errors**: `400` ride not completed, `404` ride not found, `402` payment failed

#### `POST /api/payments/confirm`
- **Auth**: Rider
- **Request Body**:
```typescript
{
  ride_id: string;
  payment_intent_id: string;
  tip?: number;
}
```
- **Success Response** (200):
```typescript
{
  payment: {
    id: string;
    amount: number;
    status: 'succeeded';
    paid_at: string;
  };
}
```
- **Errors**: `400` invalid state, `402` stripe declined

#### `GET /api/payments/history`
- **Auth**: Rider or Driver
- **Query Params**: `?page=1&limit=20&from=...&to=...`
- **Success Response** (200):
```typescript
{
  payments: Array<{
    id: string;
    ride_id: string;
    amount: number;
    status: string;
    created_at: string;
    pickup_address: string;
    dropoff_address: string;
  }>;
  pagination: { page: number; limit: number; total: number; totalPages: number };
}
```

### 4.7 WebSocket Events (Socket.IO — namespace `/ride-tracking`)

#### Client → Server Events

| Event | Payload | Description |
|---|---|---|
| `driver:locationUpdate` | `{ driverId: string; lat: number; lng: number }` | Driver sends GPS (every 3s) |
| `rider:requestRide` | `{ rideId: string }` | Rider confirms ride request |
| `rider:cancelRide` | `{ rideId: string; reason?: string }` | Rider cancels ride |
| `driver:acceptRide` | `{ rideId: string; driverId: string }` | Driver accepts |
| `driver:updateStatus` | `{ rideId: string; status: string }` | Driver updates ride status |
| `driver:declineRide` | `{ rideId: string; driverId: string }` | Driver declines |

#### Server → Client Events

| Event | Payload | Description |
|---|---|---|
| `ride:matched` | `{ rideId: string; driver: DriverInfo }` | Sent to rider when driver accepts |
| `ride:driverLocation` | `{ rideId: string; lat: number; lng: number }` | Driver location to rider (3s intervals) |
| `ride:statusChanged` | `{ rideId: string; status: string; timestamp: string }` | Status change to both parties |
| `ride:cancelled` | `{ rideId: string; by: string; reason?: string }` | Cancellation notification |
| `ride:paymentComplete` | `{ rideId: string; amount: number }` | Payment success notification |
| `driver:newRideRequest` | `{ ride: RideRequestInfo }` | New ride offer to nearby drivers |
| `driver:requestExpired` | `{ rideId: string }` | Ride request timed out (15s no accept) |
| `error` | `{ message: string; code: string }` | Error event |

---

## 5. State Management

### 5.1 Context Architecture

```
AuthContext (global)
├── state: { user, accessToken, isAuthenticated, isLoading }
├── dispatch actions: LOGIN, LOGOUT, REFRESH_TOKEN, SET_USER, SET_LOADING
├── actions: login(), register(), logout(), refreshToken(), changePassword()
│
RiderContext (scoped to rider routes)
├── state: { profile, isLoading, error }
├── dispatch actions: SET_PROFILE, UPDATE_PROFILE, SET_LOADING, SET_ERROR
├── actions: fetchProfile(), updateProfile()
│
DriverContext (scoped to driver routes)
├── state: { profile, documents, vehicle, earnings, isLoading, error }
├── dispatch actions: SET_PROFILE, SET_DOCUMENTS, SET_VEHICLE, SET_EARNINGS, SET_LOADING, SET_ERROR
├── actions: fetchProfile(), updateProfile(), uploadDocument(), updateVehicle(), toggleStatus(), fetchEarnings()
│
RideContext (scoped to both)
├── state: {
│     activeRide: Ride | null,
│     rideHistory: Ride[],
│     nearbyDrivers: DriverInfo[],
│     rideRequest: { status: 'idle' | 'searching' | 'found' | 'no_drivers' | 'error', driver?: DriverInfo },
│     isLoading,
│     error
│   }
├── dispatch: SET_ACTIVE_RIDE, UPDATE_RIDE_STATUS, SET_RIDE_HISTORY, SET_NEARBY_DRIVERS,
│             SET_RIDE_REQUEST, ADD_RIDE_TO_HISTORY, SET_LOADING, SET_ERROR
├── actions: requestRide(), cancelRide(), updateRideStatus(), fetchHistory(), fetchNearbyDrivers()
│
PaymentContext (scoped to both)
├── state: { paymentMethods, paymentHistory, isLoading, error }
├── dispatch actions: SET_METHODS, ADD_METHOD, REMOVE_METHOD, SET_DEFAULT,
│                     SET_HISTORY, SET_LOADING, SET_ERROR
├── actions: fetchMethods(), addMethod(), removeMethod(), setDefaultMethod(),
│            createPaymentIntent(), confirmPayment(), fetchPaymentHistory()
```

### 5.2 State Shape (TypeScript)

```typescript
// AuthState
interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

// User
interface User {
  id: string;
  email: string;
  phone: string;
  full_name: string;
  role: 'rider' | 'driver';
  avatar_url: string | null;
  created_at: string;
}

// RiderState
interface RiderState {
  profile: RiderProfile | null;
  isLoading: boolean;
  error: string | null;
}

interface RiderProfile {
  id: string;
  default_pickup_lat: number | null;
  default_pickup_lng: number | null;
  default_pickup_address: string | null;
  rating: number;
  ride_count: number;
}

// DriverState
interface DriverState {
  profile: DriverProfile | null;
  documents: DriverDocument[];
  vehicle: Vehicle | null;
  earnings: EarningsData | null;
  isLoading: boolean;
  error: string | null;
}

interface DriverProfile {
  id: string;
  license_number: string;
  license_expiry: string;
  is_verified: boolean;
  status: 'online' | 'offline' | 'busy';
  rating: number;
  ride_count: number;
  total_earnings: number;
}

interface DriverDocument {
  id: string;
  type: 'license' | 'insurance' | 'registration' | 'profile_photo';
  status: 'pending' | 'approved' | 'rejected';
  file_url: string;
  admin_comment: string | null;
  uploaded_at: string;
  reviewed_at: string | null;
}

interface Vehicle {
  id: string;
  make: string;
  model: string;
  year: number;
  color: string;
  plate_number: string;
  type: 'standard' | 'premium' | 'xl';
  capacity: number;
}

// RideState
interface RideState {
  activeRide: Ride | null;
  rideHistory: Ride[];
  nearbyDrivers: DriverInfo[];
  rideRequest: {
    status: 'idle' | 'searching' | 'found' | 'no_drivers' | 'error';
    driver?: DriverInfo;
  };
  isLoading: boolean;
  error: string | null;
}

interface Ride {
  id: string;
  rider_id: string;
  driver_id: string | null;
  pickup_lat: number;
  pickup_lng: number;
  pickup_address: string;
  dropoff_lat: number;
  dropoff_lng: number;
  dropoff_address: string;
  status: RideStatus;
  vehicle_type: VehicleType;
  fare: number | null;
  estimated_fare: number | null;
  distance_km: number | null;
  duration_min: number | null;
  payment_status: string;
  driver?: {
    id: string;
    user: { full_name: string; avatar_url: string | null };
    vehicle: Vehicle;
    rating: number;
    lat: number;
    lng: number;
  };
  rider?: {
    id: string;
    user: { full_name: string; avatar_url: string | null };
  };
  created_at: string;
  accepted_at: string | null;
  started_at: string | null;
  completed_at: string | null;
  cancelled_at: string | null;
  cancel_reason: string | null;
}

interface DriverInfo {
  id: string;
  lat: number;
  lng: number;
  distance_km: number;
  rating: number;
  vehicle: {
    type: VehicleType;
    make: string;
    model: string;
    color: string;
    plate_number: string;
  };
}

// PaymentState
interface PaymentState {
  paymentMethods: PaymentMethod[];
  paymentHistory: PaymentRecord[];
  isLoading: boolean;
  error: string | null;
}

interface PaymentMethod {
  id: string;
  card_last4: string;
  card_brand: string;
  exp_month: number;
  exp_year: number;
  is_default: boolean;
  created_at: string;
}

interface PaymentRecord {
  id: string;
  ride_id: string;
  amount: number;
  status: string;
  created_at: string;
  pickup_address: string;
  dropoff_address: string;
}
```

### 5.3 Token Strategy

- **Access token**: Stored in memory (AuthContext state). Sent via `Authorization: Bearer <token>` header.
- **Refresh token**: Stored in httpOnly, Secure, SameSite=Strict cookie. Auto-sent on `/auth/refresh`.
- **Axios interceptor**: On 401 response, attempt silent refresh. If refresh succeeds, retry original request. If refresh fails, dispatch LOGOUT and redirect to `/login`.
- **On page load**: If refresh cookie exists, call `/auth/refresh` to hydrate session. If no cookie, show login page.

---

## 6. Data Flow Diagrams

### 6.1 Ride Request & Matching Flow

```
RIDER                          SERVER                          DRIVER(S)
 │                               │                               │
 │ 1. Fill pickup/dropoff        │                               │
 │    Select vehicle type        │                               │
 │    Press "Request Ride"       │                               │
 │──────────────────────────────>│                               │
 │                               │                               │
 │ 2. Validate input             │                               │
 │    Calculate est. fare        │                               │
 │    INSERT INTO rides          │                               │
 │    (status = 'searching')     │                               │
 │                               │                               │
 │ 3. Query nearby online        │                               │
 │    verified drivers           │                               │
 │    WHERE status = 'online'    │                               │
 │    AND is_verified = true     │                               │
 │    ORDER BY distance          │                               │
 │    LIMIT 10                   │                               │
 │                               │                               │
 │ 4. For each nearby driver:    │                               │
 │    Socket.IO emit             │                               │
 │    'driver:newRideRequest'    │                               │
 │    ──────────────────────────────────────────────────────────>│
 │                               │                               │
 │ 5. Show "Searching..."        │                               │
 │    with timer                 │                               │
 │    ──────────────             │                               │
 │                               │                               │
 │                               │                    5a. Driver sees
 │                               │                    incoming card
 │                               │                    with 15s timer
 │                               │                               │
 │                               │                               │
 │                               │                    6a. Driver
 │                               │                    presses ACCEPT
 │                               │  Socket.IO 'driver:acceptRide'
 │                               │<──────────────────────────────│
 │                               │                               │
 │                               │  7. UPDATE rides              │
 │                               │     SET status = 'accepted',  │
 │                               │     driver_id = <driver>,     │
 │                               │     accepted_at = NOW()       │
 │                               │                               │
 │                               │  8. UPDATE drivers            │
 │                               │     SET status = 'busy'       │
 │                               │                               │
 │ 9. Socket.IO 'ride:matched'   │                               │
 │    with driver info           │                               │
 │<──────────────────────────────│                               │
 │                               │                               │
 │ 10. Show "Driver Found"       │                               │
 │     Card with driver info     │                               │
 │     Map with driver marker    │                               │
 │                               │                               │
 │                               │                    11. Driver sends
 │                               │                    GPS every 3s
 │                               │  Socket.IO 'driver:locationUpdate'
 │                               │<──────────────────────────────│
 │                               │                               │
 │ 12. Socket.IO                 │                               │
 │     'ride:driverLocation'     │                               │
 │     (real-time driver icon    │                               │
 │      moving on map)           │                               │
 │<──────────────────────────────│                               │
 │                               │                               │
 │                    [If no driver accepts within 30s]          │
 │                               │                               │
 │  13. Timer expires            │                               │
 │  14. Update ride status       │                               │
 │      = 'cancelled'            │                               │
 │      cancelled_by = 'system'  │                               │
 │      cancel_reason =          │                               │
 │      'no_drivers_available'   │                               │
 │                               │                               │
 │  15. Socket.IO                │                               │
 │      'ride:cancelled'         │                               │
 │<──────────────────────────────│                               │
 │                               │                               │
 │  16. Show "No drivers         │                               │
 │      available"               │                               │
 │      "Try Again" button       │                               │
```

### 6.2 Ride Lifecycle — Full State Machine

```
                      ┌──────────┐
                      │  pending │  (initial — rider confirmed details)
                      └────┬─────┘
                           │
                      ┌────▼─────┐
                      │ searching│  (server looking for drivers)
                      └────┬─────┘
                           │
               ┌───────────┼───────────┐
               │           │           │
          ┌────▼────┐  ┌──▼───┐   ┌───▼────┐
          │ accepted│  │cancelled│ │cancelled│
          │         │  │ (rider) │ │ (system)│
          └────┬────┘  └────────┘  └─────────┘
               │
          ┌────▼────┐
          │ arrived │  (driver at pickup)
          └────┬────┘
               │
          ┌────▼────────┐
          │ in_progress │  (on trip)
          └────┬────────┘
               │
          ┌────▼────────┐
          │  completed  │  (trip ended — payment triggered)
          └─────────────┘

Cancellation can also happen from: searching (rider), accepted (rider or driver)
Driver can cancel from accepted only (penalty applied)
Once arrived → driver cannot cancel; only rider can cancel with fee
```

### 6.3 Fare Calculation Flow

```
Ride Completion
│
├─ Server retrieves ride distance_km, duration_min
│
├─ Fare Components:
│   Base fare:          $2.50
│   Per km:             $1.20 × distance_km
│   Per minute:         $0.25 × duration_min
│   Vehicle multiplier: standard = 1.0, premium = 1.5, xl = 2.0
│   Platform fee:       15% of subtotal
│
├─ total = (base + distance + time) × multiplier + platform_fee
│
├─ UPDATE rides SET fare = total, payment_status = 'processing'
│
├─ Stripe PaymentIntent.create()
│   amount = total × 100 (cents)
│   currency = 'usd'
│   customer = rider's stripe customer ID
│   payment_method = rider's default PM
│   confirm = false (client confirms)
│
├─ Return client_secret to client
│
└─ Client confirms via Stripe.js → POST /payments/confirm
```

### 6.4 Error Recovery Flow (Token Expiry)

```
Axios request interceptor
│
├─ Request sent with Authorization header
│
├─ Server responds 401
│
├─ Interceptor catches 401
│   ├─ If refresh already in progress → queue request
│   └─ If no refresh in progress:
│       ├─ POST /api/auth/refresh
│       ├─ On success: update token in AuthContext, retry all queued requests
│       └─ On failure:
│           ├─ Clear AuthContext
│           ├─ Clear localStorage
│           ├─ Redirect to /login
│           └─ Show toast "Session expired. Please log in again."
│
└─ Retry original request with new token
```

---

## 7. Edge Cases & States

### 7.1 Per-Component Edge Cases

| Component | Loading | Empty | Error | Offline | Edge Case |
|---|---|---|---|---|---|
| **LoginPage** | Spinner on submit | N/A | "Invalid credentials" banner, red border on password | "No internet" with retry button | Rate-limit: "Too many attempts. Try again in 30s." Account locked after 5 failed attempts |
| **RegisterPage** | Spinner on submit | N/A | Field-level validation (email format, password strength, phone format). "Email already registered" | Disabled submit + offline banner | Weak password, existing email/phone, role already exists |
| **BookRidePage** | Map loading skeleton, "Calculating fare..." | No recent locations (empty suggestions) | "Failed to load map" / "Route calculation failed" / "No nearby drivers" | "Offline — can't request ride" banner | Same pickup/dropoff, extremely long route (>500km), no network for map tiles, GPS permission denied |
| **RideHistoryPage** | Skeleton list (5 placeholder cards) | EmptyState "No rides yet" with Book Now CTA | ErrorState with retry | Show cached data + "Last updated X min ago" banner | Pagination cursor, concurrent fetches, ride deleted by admin |
| **ProfilePage** | Skeleton form fields | N/A | "Failed to save" inline error | "Changes saved offline — will sync" | Email change requires verification, avatar upload too large |
| **PaymentMethodsPage** | Skeleton cards | EmptyState "Add a payment method" + Stripe Elements form | "Card declined" / "Stripe error" / "Could not remove default" | Offline — can't add/remove | Remove last card requires new card first, expired card, default card can't be removed (must set new default first) |
| **DriverRegistrationPage** | Step spinner | N/A | Per-field validation, file upload failed (size/type), "License number already exists" | Disabled submit + offline banner | Incomplete multi-step, file too large, wrong file type, browser file dialog cancelled |
| **VerificationPage** | Loading status + docs | N/A | "Upload failed" per document | Cannot upload offline | File size >10MB, virus scan reject, re-upload after rejection, partial upload state |
| **DriverDashboardPage** | Skeleton stats + empty map | "Complete your profile to go online" (if not verified) | "Failed to fetch earnings" | Offline status shown as disconnected | Toggle online while busy, toggle while on ride, driver deleted by admin |
| **RideRequestsPage** | No loading (Socket.IO push) | IncomingRequestCard with 15s countdown, or EmptyState | Socket.IO disconnect banner | "Waiting for connection..." | Two requests simultaneously (only first wins), request expires while deciding, ride accepted but then driver goes offline |
| **MapView** | Skeleton map placeholder | N/A | "Could not load map tiles" with fallback text directions | No tile rendering, show text directions | GPS drift, poor accuracy, location services disabled, browser permissions revoked mid-ride |

### 7.2 Global Edge Cases

| Category | Edge Case | Handling |
|---|---|---|
| **Auth** | Token expires mid-ride | Silent refresh in socket middleware. If refresh fails, rider sees "Session expired" but ride continues; driver can complete ride. System reconciles on reconnect. |
| **Auth** | Multiple tabs | Refresh token used once invalidates old one. Second tab gets new token, first tab's next 401 will refresh again. |
| **Auth** | Concurrent login from different device | Previous refresh tokens remain valid. Server issues new one, old still works until expiry. |
| **Ride** | Rider cancels after driver accepts | If within 5 min / before driver arrives → free cancel. If after 5 min or driver already arrived → cancellation fee charged. |
| **Ride** | Driver cancels after accepting | Driver penalty: 1 strike. 3 strikes → 24h suspension. |
| **Ride** | Rider creates second ride while first is active | Server rejects with 409 "You already have an active ride" |
| **Ride** | No drivers found | After 30s polling, return "searching" for up to 60s, then mark as cancelled, notify rider, suggest increasing fare or trying later |
| **Ride** | Both rider and driver cancel simultaneously | First request wins. Second gets 400 "Ride already cancelled" |
| **Ride** | Driver assigned but goes offline | Server detects disconnect. After 30s, if no reconnection, cancel ride + notify rider + find new driver |
| **Ride** | GPS drift / inaccurate location | Client-side smoothing. Server ignores updates with unrealistic speed (>200 km/h) |
| **Payment** | Stripe charge fails | Retry with different card. If no other card, mark payment as failed, notify rider to add new card. Ride stays as completed but payment_status = 'failed' |
| **Payment** | Ride completed but payment not processed | Background job retries every 5 min for up to 24h. After 24h, escalate to admin |
| **Payment** | Refund request | Admin-only endpoint. Stripe refund creates reversal, updates ride payment_status = 'refunded' |
| **Network** | Socket.IO disconnects mid-ride | Client shows "Reconnecting..." banner. On reconnect, server syncs current ride state. If disconnected >30s, rider can see stale driver location. |
| **Network** | POST request fails (network error) | Axios retry interceptor: retry 3 times with exponential backoff (1s, 2s, 4s). Show offline banner after all retries fail. |
| **Concurrency** | Two drivers accept same ride simultaneously | Server-side atomic check: UPDATE rides SET driver_id = ? WHERE id = ? AND driver_id IS NULL. Only first succeeds. Second gets error. |
| **Concurrency** | Admin verifies driver while they're updating documents | Row-level locking with `SELECT ... FOR UPDATE` during verification to prevent race |
| **Data** | Very long ride history (>1000 entries) | Server-side pagination (default 20, max 50 per page). Client-side infinite scroll. |
| **Data** | Large file uploads | Multer middleware: 10MB limit. Image compression before upload. Chunked upload for >5MB. |
| **Data** | Phone number formatting | Store in E.164 (+1234567890). Client normalizes input. |
| **Security** | SQL Injection | All queries use parameterized queries (`$1, $2, ...`). Never string interpolation. |
| **Security** | XSS | React auto-escapes. User-generated content (names, addresses) sanitized on backend. |
| **Security** | CSRF | Refresh token in httpOnly cookie. CORS restricted to frontend origin. |
| **UI** | Double-click on "Request Ride" button | Button disabled immediately on click (loading=True). Prevents duplicate ride creation. |
| **UI** | Browser back button during ride | Prevent navigation with `beforeunload` event. Show confirmation: "You have an active ride. Are you sure?" |
| **UI** | Screen orientation change (map) | Map container resizes responsively. Re-render tiles on resize. |
| **UI** | Stripe Elements iframe blocked by ad-blocker | Fallback: manual card entry form (collect number, expiry, CVC, zip). Only if Stripe.js fails to load. |

---

## 8. File Structure

### 8.1 Frontend (`frontend/`)

```
frontend/
├── index.html
├── package.json
├── tsconfig.json
├── tsconfig.node.json
├── vite.config.ts
├── tailwind.config.ts
├── postcss.config.js
├── .env                         // VITE_API_URL, VITE_STRIPE_KEY, VITE_SOCKET_URL
├── .env.example
├── .eslintrc.cjs
├── public/
│   ├── favicon.ico
│   ├── logo.svg
│   └── driver-placeholder.svg
│
└── src/
    ├── main.tsx                  // ReactDOM.createRoot, wrap providers
    ├── App.tsx                   // Router definition, provider nesting
    ├── index.css                 // Tailwind directives, global styles
    ├── vite-env.d.ts
    │
    ├── types/
    │   └── index.ts              // All TypeScript interfaces, enums, type guards
    │
    ├── constants/
    │   ├── routes.ts             // Route path constants
    │   ├── api.ts                // API base URL, endpoints
    │   └── config.ts             // App-wide config (timeouts, limits, etc.)
    │
    ├── contexts/
    │   ├── AuthContext.tsx        // Auth state + provider + useAuth hook
    │   ├── RiderContext.tsx       // Rider state + provider + useRider hook
    │   ├── DriverContext.tsx      // Driver state + provider + useDriver hook
    │   ├── RideContext.tsx        // Ride state + provider + useRide hook
    │   ├── PaymentContext.tsx     // Payment state + provider + usePayment hook
    │   └── SocketContext.tsx      // Socket.IO connection + useSocket hook
    │
    ├── hooks/
    │   ├── useAuth.ts             // Re-export from AuthContext
    │   ├── useRide.ts
    │   ├── useSocket.ts
    │   ├── useGeolocation.ts      // navigator.geolocation wrapper
    │   ├── useCountdown.ts        // Timer hook (ride request countdown)
    │   ├── useOnlineStatus.ts     // navigator.onLine listener
    │   ├── useInfiniteScroll.ts   // IntersectionObserver for pagination
    │   └── useDebounce.ts         // Debounce for search inputs
    │
    ├── services/
    │   ├── api.ts                 // Axios instance, interceptors, retry logic
    │   ├── socket.ts              // Socket.IO client, event emitter/on wrappers
    │   ├── auth.service.ts        // login(), register(), refresh(), logout()
    │   ├── rider.service.ts       // profile CRUD
    │   ├── driver.service.ts      // profile, documents, vehicle, status
    │   ├── ride.service.ts        // request, cancel, history, nearby drivers
    │   └── payment.service.ts     // methods, intents, confirm, history
    │
    ├── utils/
    │   ├── formatters.ts          // currency, date, distance formatters
    │   ├── validators.ts          // email, phone, password validation
    │   ├── geo.ts                 // distance calc, bounds helpers
    │   └── storage.ts             // localStorage wrapper with typed get/set
    │
    ├── components/
    │   ├── ui/
    │   │   ├── Button.tsx
    │   │   ├── Input.tsx
    │   │   ├── Card.tsx
    │   │   ├── Modal.tsx
    │   │   ├── Spinner.tsx
    │   │   ├── EmptyState.tsx
    │   │   ├── ErrorState.tsx
    │   │   ├── Toast.tsx
    │   │   ├── ToastProvider.tsx
    │   │   ├── Badge.tsx
    │   │   ├── Avatar.tsx
    │   │   ├── Select.tsx
    │   │   ├── RadioGroup.tsx
    │   │   ├── Toggle.tsx
    │   │   ├── Skeleton.tsx
    │   │   └── OfflineBanner.tsx
    │   │
    │   ├── layout/
    │   │   ├── AuthLayout.tsx
    │   │   ├── RiderLayout.tsx
    │   │   ├── DriverLayout.tsx
    │   │   ├── BottomNav.tsx
    │   │   ├── Header.tsx
    │   │   └── ProtectedRoute.tsx
    │   │
    │   ├── ride/
    │   │   ├── RideStatusCard.tsx
    │   │   ├── FareEstimateCard.tsx
    │   │   ├── VehicleTypeSelector.tsx
    │   │   ├── VehicleTypeCard.tsx
    │   │   ├── LocationSearch.tsx
    │   │   ├── NearbyDriversCount.tsx
    │   │   ├── RideRequestStatus.tsx
    │   │   ├── DriverFoundCard.tsx
    │   │   ├── NoDriversCard.tsx
    │   │   ├── RideHistoryCard.tsx
    │   │   └── RideProgress.tsx
    │   │
    │   ├── map/
    │   │   ├── MapView.tsx
    │   │   ├── PickupMarker.tsx
    │   │   ├── DropoffMarker.tsx
    │   │   └── DriverMarker.tsx
    │   │
    │   ├── payment/
    │   │   ├── PaymentMethodCard.tsx
    │   │   └── AddCardForm.tsx
    │   │
    │   ├── rider/
    │   │   ├── QuickActionsCard.tsx
    │   │   ├── ActiveRideCard.tsx
    │   │   └── RecentRidesPreview.tsx
    │   │
    │   ├── driver/
    │   │   ├── StatusToggle.tsx
    │   │   ├── EarningsSummary.tsx
    │   │   ├── StatCard.tsx
    │   │   ├── IncomingRequestCard.tsx
    │   │   ├── DocumentUploadSection.tsx
    │   │   ├── UploadZone.tsx
    │   │   ├── VerificationStatusBanner.tsx
    │   │   ├── VehicleInfoForm.tsx
    │   │   └── EarningsRow.tsx
    │   │
    │   └── admin/
    │       ├── DriverVerificationCard.tsx
    │       └── DocumentPreview.tsx
    │
    └── pages/
        ├── auth/
        │   ├── LoginPage.tsx
        │   └── RegisterPage.tsx
        │
        ├── rider/
        │   ├── HomePage.tsx
        │   ├── BookRidePage.tsx
        │   ├── RideHistoryPage.tsx
        │   ├── ProfilePage.tsx
        │   └── PaymentMethodsPage.tsx
        │
        ├── driver/
        │   ├── DriverDashboardPage.tsx
        │   ├── VerificationPage.tsx
        │   ├── RideRequestsPage.tsx
        │   ├── DriverEarningsPage.tsx
        │   └── DriverProfilePage.tsx
        │
        ├── admin/
        │   ├── AdminDashboardPage.tsx
        │   ├── DriverVerificationPage.tsx
        │   └── AdminLoginPage.tsx
        │
        └── NotFoundPage.tsx
```

### 8.2 Backend (`backend/`)

```
backend/
├── package.json
├── tsconfig.json
├── nodemon.json
├── .env                         // PORT, DB_URL, JWT_SECRET, JWT_REFRESH_SECRET, STRIPE_KEY
├── .env.example
├── .eslintrc.cjs
├── .gitignore
│
└── src/
    ├── server.ts                 // HTTP server creation, Socket.IO bootstrap
    ├── app.ts                    // Express app setup, middleware chain, route mounting
    │
    ├── types/
    │   ├── index.ts              // All TypeScript interfaces, enums, request/response types
    │   └── express.d.ts          // Express Request augmentation (user property)
    │
    ├── constants/
    │   └── index.ts              // Enums, config constants, status codes, fare rates
    │
    ├── config/
    │   ├── database.ts           // pg Pool creation, connection string parsing
    │   ├── env.ts                // Zod-validated environment variables
    │   └── stripe.ts             // Stripe SDK initialization
    │
    ├── middleware/
    │   ├── auth.ts               // JWT verification, role check, optional auth
    │   ├── errorHandler.ts       // Global error handler (operational vs programmer errors)
    │   ├── validate.ts           // Zod schema validation middleware factory
    │   ├── upload.ts             // Multer configuration, file filters, size limits
    │   └── rateLimiter.ts        // Express rate limiting (auth endpoints: 5/min)
    │
    ├── validators/               // Zod schemas per route group
    │   ├── auth.schema.ts
    │   ├── rider.schema.ts
    │   ├── driver.schema.ts
    │   ├── ride.schema.ts
    │   └── payment.schema.ts
    │
    ├── models/                   // Raw SQL query functions
    │   ├── user.model.ts         // create, findByEmail, findById, updatePassword
    │   ├── rider.model.ts        // create, findById, update
    │   ├── driver.model.ts       // create, findById, update, updateStatus, updateLocation
    │   ├── driverDocument.model.ts // create, findByDriverId, updateStatus
    │   ├── vehicle.model.ts      // create, findByDriverId, update
    │   ├── ride.model.ts         // create, findById, findByRider, findByDriver,
    │   │                         // findNearbyDrivers, updateStatus, updatePaymentStatus
    │   ├── rideStatusLog.model.ts // create, findByRideId
    │   ├── paymentMethod.model.ts // create, findByUserId, deleteById, setDefault
    │   ├── payment.model.ts      // create, findByRider, findByDriver, findByRideId
    │   ├── refreshToken.model.ts  // create, findByToken, revokeById, revokeAllByUser
    │   └── rating.model.ts       // create, averageByUser
    │
    ├── services/
    │   ├── auth.service.ts       // register, login, refresh, logout, changePassword
    │   ├── rider.service.ts      // getProfile, updateProfile
    │   ├── driver.service.ts     // completeRegistration, getProfile, updateProfile,
    │   │                         // uploadDocument, updateVehicle, toggleStatus
    │   ├── ride.service.ts       // requestRide, cancelRide, updateRideStatus,
    │   │                         // findNearbyDrivers, getRideHistory, getRideDetails
    │   ├── matching.service.ts   // Driver matching algorithm, radius search, Socket.IO emit
    │   ├── payment.service.ts    // addMethod, removeMethod, setDefault,
    │   │                         // createPaymentIntent, confirmPayment, getHistory
    │   ├── fare.service.ts       // calculateFare (base + distance + time + multiplier)
    │   ├── socket.service.ts     // Socket.IO event handling, room management, broadcasting
    │   └── admin.service.ts      // getPendingDrivers, verifyDriver, reviewDocument
    │
    ├── routes/
    │   ├── index.ts              // Route aggregator, mounts all sub-routers on /api
    │   ├── auth.routes.ts
    │   ├── rider.routes.ts
    │   ├── driver.routes.ts
    │   ├── ride.routes.ts
    │   ├── payment.routes.ts
    │   └── admin.routes.ts
    │
    ├── socket/
    │   ├── index.ts              // Socket.IO server init, namespace setup, auth middleware
    │   └── ride.handler.ts       // Socket event handlers for ride events
    │
    ├── utils/
    │   ├── errors.ts             // Custom error classes (AppError, NotFoundError, etc.)
    │   ├── helpers.ts            // Pagination helper, token generation, async wrapper
    │   ├── logger.ts             // Winston/Pino logger setup
    │   └── asyncHandler.ts       // Express async error wrapper
    │
    ├── jobs/
    │   ├── index.ts              // Bull/cron job scheduler
    │   └── paymentRetry.job.ts   // Retry failed payments every 5 min
    │
    └── sql/
        └── migrations/
            ├── 001_create_users.sql
            ├── 002_create_riders.sql
            ├── 003_create_drivers.sql
            ├── 004_create_driver_documents.sql
            ├── 005_create_vehicles.sql
            ├── 006_create_rides.sql
            ├── 007_create_ride_status_log.sql
            ├── 008_create_payment_methods.sql
            ├── 009_create_payments.sql
            └── 010_create_refresh_tokens.sql
```

---

## 9. Acceptance Criteria

### 9.1 Module 1 — User Registration

| ID | Criterion | Priority |
|---|---|---|
| USR-01 | Rider can sign up with email, phone, password, and full name | P0 |
| USR-02 | Email and phone must be unique — duplicate registration returns 409 | P0 |
| USR-03 | Password must be at least 8 characters with 1 uppercase and 1 number | P0 |
| USR-04 | Rider receives access token + refresh token on successful registration | P0 |
| USR-05 | Rider can log in with email + password | P0 |
| USR-06 | Invalid credentials return 401 with "Invalid email or password" | P0 |
| USR-07 | More than 5 failed login attempts lock the account for 30 minutes | P1 |
| USR-08 | Rider can log out — refresh token revoked server-side | P0 |
| USR-09 | Rider can refresh access token using refresh token (silent refresh) | P0 |
| USR-10 | Expired refresh token returns 401 with "Session expired" | P0 |
| USR-11 | Rider can view and edit their profile (name, phone, avatar, default location) | P1 |
| USR-12 | Rider can change password by providing current + new password | P1 |
| USR-13 | Rider sees appropriate loading spinners during auth operations | P0 |
| USR-14 | Rider sees inline validation errors on fields without losing form state | P0 |
| USR-15 | Rider sees network error banner when API is unreachable | P1 |

### 9.2 Module 2 — Driver Registration

| ID | Criterion | Priority |
|---|---|---|
| DRV-01 | Driver can sign up as a user with role='driver' | P0 |
| DRV-02 | After user creation, driver can complete registration with license and vehicle info | P0 |
| DRV-03 | License number must be unique — duplicate returns 409 | P0 |
| DRV-04 | Driver can upload documents (license, insurance, registration, photo) | P0 |
| DRV-05 | Uploaded files are validated for type (JPEG, PNG, PDF) and size (max 10MB) | P0 |
| DRV-06 | Invalid file types return 415 "Unsupported file type" | P1 |
| DRV-07 | Files over 10MB return 413 "File too large" | P1 |
| DRV-08 | Driver can view document upload status (pending/approved/rejected) | P0 |
| DRV-09 | Rejected documents show admin comment explaining reason | P1 |
| DRV-10 | Driver can re-upload rejected documents | P1 |
| DRV-11 | Driver can edit vehicle info (make, model, year, color, plate, type) | P1 |
| DRV-12 | Driver cannot go online until documents are approved (is_verified = true) | P0 |
| DRV-13 | Driver can toggle online/offline status (only when verified) | P0 |
| DRV-14 | Driver status changes to "busy" when they accept a ride | P0 |
| DRV-15 | Admin can view list of pending driver verifications | P0 |
| DRV-16 | Admin can approve or reject individual documents with comments | P0 |
| DRV-17 | Admin can approve or reject the entire driver verification | P0 |
| DRV-18 | Driver sees progress indicator during multi-step registration | P1 |

### 9.3 Module 3 — Booking

| ID | Criterion | Priority |
|---|---|---|
| BOK-01 | Rider can set pickup location by typing address or using current GPS | P0 |
| BOK-02 | Rider can set dropoff location by typing address or tapping map | P0 |
| BOK-03 | Rider can select vehicle type (standard/premium/xl) with price range | P0 |
| BOK-04 | Ride request shows estimated fare, distance, and duration before confirming | P0 |
| BOK-05 | Rider can confirm ride request | P0 |
| BOK-06 | On confirm, server creates ride with status 'searching' | P0 |
| BOK-07 | Server finds nearby verified online drivers within 5km radius | P0 |
| BOK-08 | Nearby drivers receive real-time ride request via Socket.IO | P0 |
| BOK-09 | Driver sees incoming request card with 15-second countdown | P0 |
| BOK-10 | Driver can accept or decline the ride request | P0 |
| BOK-11 | Multiple drivers can be offered the same ride — only first accept wins | P0 |
| BOK-12 | On driver accept, rider receives driver info (name, photo, vehicle, rating, ETA) | P0 |
| BOK-13 | Rider sees driver's real-time location on map (updated every 3 seconds) | P0 |
| BOK-14 | Driver can update ride status: accepted → arrived → in_progress → completed | P0 |
| BOK-15 | Both parties see status changes in real-time | P0 |
| BOK-16 | Rider can cancel ride before driver arrives (free within first 5 min) | P0 |
| BOK-17 | Cancellation after 5 min or after driver arrives charges a cancellation fee | P1 |
| BOK-18 | Driver can cancel only before arriving (with penalty) | P1 |
| BOK-19 | If no driver accepts within 60 seconds, ride is cancelled with "no drivers" reason | P0 |
| BOK-20 | Rider can retry after "no drivers" result | P0 |
| BOK-21 | Rider can view ride history with pagination and filter (completed/cancelled) | P1 |
| BOK-22 | Rider can view details of any past ride | P1 |
| BOK-23 | Rider can rate driver after ride completion (1–5 stars + comment) | P1 |
| BOK-24 | Both parties see appropriate loading/error/empty states throughout booking flow | P0 |
| BOK-25 | Rider cannot request a new ride while one is active | P0 |

### 9.4 Module 4 — Payment

| ID | Criterion | Priority |
|---|---|---|
| PAY-01 | Rider can add a credit/debit card via Stripe Elements | P0 |
| PAY-02 | Card details are tokenized by Stripe — server never sees raw card numbers | P0 |
| PAY-03 | Rider can see all saved payment methods with last 4 digits and brand | P0 |
| PAY-04 | Rider can set a default payment method | P1 |
| PAY-05 | Rider can remove a non-default payment method | P1 |
| PAY-06 | Rider cannot remove the default payment method without setting a new default first | P1 |
| PAY-07 | Fare is calculated on ride completion based on: base fare + distance × rate + time × rate | P0 |
| PAY-08 | Fare is multiplied by vehicle type multiplier (standard=1.0, premium=1.5, xl=2.0) | P0 |
| PAY-09 | Platform fee (15%) is added to the final fare | P0 |
| PAY-10 | On ride completion, server creates a Stripe PaymentIntent | P0 |
| PAY-11 | Rider confirms payment on client side with Stripe.js | P0 |
| PAY-12 | Successful payment updates ride payment_status to 'paid' | P0 |
| PAY-13 | Rider sees payment receipt with fare breakdown | P1 |
| PAY-14 | Rider can view complete payment history with pagination | P1 |
| PAY-15 | Failed payment shows specific error message (card declined, insufficient funds, etc.) | P0 |
| PAY-16 | Rider can retry payment with a different card after failure | P0 |
| PAY-17 | Driver can view their earnings summary (today, week, total) | P1 |
| PAY-18 | Driver can view individual ride earnings with fee breakdown | P1 |
| PAY-19 | Payment history shows date, amount, status, and ride details | P1 |
| PAY-20 | Admin can process refunds for completed payments | P2 |

### 9.5 Cross-Cutting Acceptance Criteria

| ID | Criterion | Priority |
|---|---|---|
| XCT-01 | All API endpoints return appropriate HTTP status codes (200, 201, 400, 401, 403, 404, 409, 500) | P0 |
| XCT-02 | All API errors return consistent JSON shape: `{ error: { code: string; message: string; details?: any } }` | P0 |
| XCT-03 | All frontend pages render without console errors | P0 |
| XCT-04 | All forms validate input and show error messages next to fields | P0 |
| XCT-05 | Application works on latest Chrome, Firefox, Safari, and Edge | P1 |
| XCT-06 | Application is responsive (mobile-first, tablet, desktop) | P0 |
| XCT-07 | Sensitive data (tokens, passwords, Stripe keys) never appear in logs or client bundle | P0 |
| XCT-08 | All SQL queries use parameterized statements (no string concatenation) | P0 |
| XCT-09 | Application gracefully handles network disconnection with banners | P1 |
| XCT-10 | Application gracefully handles server downtime with 500 error page | P1 |
| XCT-11 | All API routes have rate limiting appropriate to their sensitivity | P1 |
| XCT-12 | Frontend bundle size stays under 300KB (gzipped) for initial load | P2 |

---

## Appendix A: TypeScript Enums

```typescript
// Shared across frontend and backend
export enum UserRole {
  RIDER = 'rider',
  DRIVER = 'driver',
}

export enum DriverStatus {
  ONLINE = 'online',
  OFFLINE = 'offline',
  BUSY = 'busy',
}

export enum DocumentStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

export enum DocumentType {
  LICENSE = 'license',
  INSURANCE = 'insurance',
  REGISTRATION = 'registration',
  PROFILE_PHOTO = 'profile_photo',
}

export enum VehicleType {
  STANDARD = 'standard',
  PREMIUM = 'premium',
  XL = 'xl',
}

export enum RideStatus {
  PENDING = 'pending',
  SEARCHING = 'searching',
  ACCEPTED = 'accepted',
  ARRIVED = 'arrived',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export enum PaymentStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  PAID = 'paid',
  FAILED = 'failed',
  REFUNDED = 'refunded',
}

export enum PaymentIntentStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  SUCCEEDED = 'succeeded',
  FAILED = 'failed',
  REFUNDED = 'refunded',
}

export enum CancelledBy {
  RIDER = 'rider',
  DRIVER = 'driver',
  SYSTEM = 'system',
}
```

## Appendix B: Fare Calculation Formula

```typescript
interface FareInput {
  distance_km: number;
  duration_min: number;
  vehicle_type: VehicleType;
}

interface FareResult {
  base_fare: number;
  distance_fare: number;
  time_fare: number;
  subtotal: number;
  multiplier: number;
  platform_fee: number;
  total: number;
}

function calculateFare(input: FareInput): FareResult {
  const rates = {
    base_fare: 2.50,
    per_km: 1.20,
    per_min: 0.25,
    multipliers: {
      [VehicleType.STANDARD]: 1.0,
      [VehicleType.PREMIUM]: 1.5,
      [VehicleType.XL]: 2.0,
    },
    platform_fee_percent: 0.15, // 15%
  };

  const base_fare = rates.base_fare;
  const distance_fare = rates.per_km * input.distance_km;
  const time_fare = rates.per_min * input.duration_min;
  const subtotal = base_fare + distance_fare + time_fare;
  const multiplier = rates.multipliers[input.vehicle_type];
  const multiplied = subtotal * multiplier;
  const platform_fee = Math.round(multiplied * rates.platform_fee_percent * 100) / 100;
  const total = Math.round((multiplied + platform_fee) * 100) / 100;

  return {
    base_fare,
    distance_fare: Math.round(distance_fare * 100) / 100,
    time_fare: Math.round(time_fare * 100) / 100,
    subtotal: Math.round(subtotal * 100) / 100,
    multiplier,
    platform_fee,
    total,
  };
}
```

## Appendix C: Key Dependencies

### Frontend (package.json)
```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.20.0",
    "@stripe/react-stripe-js": "^2.4.0",
    "@stripe/stripe-js": "^2.2.0",
    "socket.io-client": "^4.7.0",
    "axios": "^1.6.0",
    "leaflet": "^1.9.0",
    "react-leaflet": "^4.2.0",
    "date-fns": "^3.0.0",
    "clsx": "^2.0.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "@types/leaflet": "^1.9.0",
    "@vitejs/plugin-react": "^4.2.0",
    "typescript": "^5.3.0",
    "vite": "^5.0.0",
    "tailwindcss": "^3.4.0",
    "postcss": "^8.4.0",
    "autoprefixer": "^10.4.0",
    "eslint": "^8.55.0",
    "@typescript-eslint/eslint-plugin": "^6.0.0",
    "@typescript-eslint/parser": "^6.0.0"
  }
}
```

### Backend (package.json)
```json
{
  "dependencies": {
    "express": "^4.18.0",
    "cors": "^2.8.0",
    "helmet": "^7.1.0",
    "morgan": "^1.10.0",
    "pg": "^8.11.0",
    "bcrypt": "^5.1.0",
    "jsonwebtoken": "^9.0.0",
    "zod": "^3.22.0",
    "multer": "^1.4.5",
    "stripe": "^14.0.0",
    "socket.io": "^4.7.0",
    "dotenv": "^16.3.0",
    "winston": "^3.11.0",
    "express-rate-limit": "^7.1.0",
    "uuid": "^9.0.0",
    "date-fns": "^3.0.0"
  },
  "devDependencies": {
    "@types/express": "^4.17.0",
    "@types/cors": "^2.8.0",
    "@types/bcrypt": "^5.0.0",
    "@types/jsonwebtoken": "^9.0.0",
    "@types/multer": "^1.4.0",
    "@types/pg": "^8.10.0",
    "@types/uuid": "^9.0.0",
    "@types/node": "^20.10.0",
    "typescript": "^5.3.0",
    "ts-node": "^10.9.0",
    "nodemon": "^3.0.0",
    "eslint": "^8.55.0",
    "@typescript-eslint/eslint-plugin": "^6.0.0",
    "@typescript-eslint/parser": "^6.0.0"
  }
}
```

---

*End of Specification Document*
