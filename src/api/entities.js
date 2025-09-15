// entities.js - Entity classes for Django API
import djangoClient from './djangoClient';

// Base Entity class with common CRUD operations
class BaseEntity {
  constructor(endpoint) {
    this.endpoint = endpoint;
    this.client = djangoClient;
  }

  // List entities with optional filters
  async list(params = {}) {
    return this.client.get(this.endpoint, params);
  }

  // Get paginated results
  async paginated(page = 1, pageSize = 20, filters = {}) {
    return this.client.getPaginated(this.endpoint, page, pageSize, filters);
  }

  // Get single entity by ID
  async get(id) {
    return this.client.get(`${this.endpoint}${id}/`);
  }

  // Create new entity
  async create(data) {
    return this.client.post(this.endpoint, data);
  }

  // Update entity
  async update(id, data) {
    return this.client.put(`${this.endpoint}${id}/`, data);
  }

  // Partial update
  async patch(id, data) {
    return this.client.patch(`${this.endpoint}${id}/`, data);
  }

  // Delete entity
  async delete(id) {
    return this.client.delete(`${this.endpoint}${id}/`);
  }

  // Search entities
  async search(query, filters = {}) {
    return this.client.search(this.endpoint, query, filters);
  }
}

// System Management Entities
export class User extends BaseEntity {
  constructor() {
    super('/system/users/');
  }

  async getCurrentUser() {
    return this.client.get('/system/users/me/');
  }

  async updateProfile(data) {
    return this.client.patch('/system/users/me/', data);
  }

  async changePassword(oldPassword, newPassword) {
    return this.client.post('/system/users/change-password/', {
      old_password: oldPassword,
      new_password: newPassword
    });
  }

  async register(userData) {
    return this.client.post('/system/users/register/', userData);
  }
}

export class Organization extends BaseEntity {
  constructor() {
    super('/system/organizations/');
  }

  async registerOrganization(organizationData) {
    return this.client.post('/system/organizations/register/', organizationData);
  }

  async getSettings() {
    return this.client.get('/system/organizations/settings/');
  }

  async updateSettings(settings) {
    return this.client.patch('/system/organizations/settings/', settings);
  }
}

export class ThemeSettings extends BaseEntity {
  constructor() {
    super('/system/theme-settings/');
  }

  async getCurrent() {
    return this.client.get('/system/theme-settings/current/');
  }

  async updateCurrent(settings) {
    return this.client.patch('/system/theme-settings/current/', settings);
  }
}

export class NavigationSettings extends BaseEntity {
  constructor() {
    super('/system/navigation-settings/');
  }

  async getCurrent() {
    return this.client.get('/system/navigation-settings/current/');
  }

  async updateCurrent(settings) {
    return this.client.patch('/system/navigation-settings/current/', settings);
  }
}

export class FormConfiguration extends BaseEntity {
  constructor() {
    super('/system/form-configurations/');
  }

  async getByType(formType) {
    return this.client.get(this.endpoint, { form_type: formType });
  }
}

// Vehicle Management Entities
export class Location extends BaseEntity {
  constructor() {
    super('/vehicles/locations/');
  }

  async getWithDetails(id) {
    return this.client.get(`${this.endpoint}${id}/`, { detail: true });
  }

  async listWithVehicles() {
    return this.client.get(this.endpoint, { detail: true });
  }
}

export class VehicleType extends BaseEntity {
  constructor() {
    super('/vehicles/vehicle-types/');
  }

  async getActive() {
    return this.client.get(this.endpoint, { active: true });
  }

  async getByCategory(category) {
    return this.client.get(this.endpoint, { category });
  }

  async getWithDetails(id) {
    return this.client.get(`${this.endpoint}${id}/`, { detail: true });
  }
}

export class Car extends BaseEntity {
  constructor() {
    super('/vehicles/cars/');
  }

  async getAvailable(filters = {}) {
    return this.client.get('/vehicles/cars/available/', filters);
  }

  async getByStatus(status) {
    return this.client.get(this.endpoint, { status });
  }

  async getByLocation(locationId) {
    return this.client.get(this.endpoint, { location: locationId });
  }

  async getByVehicleType(vehicleTypeId) {
    return this.client.get(this.endpoint, { vehicle_type: vehicleTypeId });
  }

  async getNeedingService() {
    return this.client.get('/vehicles/cars/needing-service/');
  }

  async updateStatus(carId, status) {
    return this.client.post(`/vehicles/cars/${carId}/status/`, { status });
  }

  async updateLocation(carId, locationId) {
    return this.client.post(`/vehicles/cars/${carId}/location/`, { location_id: locationId });
  }

  async updateGPS(carId, gpsData) {
    return this.client.post(`/vehicles/cars/${carId}/gps/`, gpsData);
  }

  async getWithDetails(id) {
    return this.client.get(`${this.endpoint}${id}/`, { detail: true });
  }
}

export class ServiceRecord extends BaseEntity {
  constructor() {
    super('/vehicles/service-records/');
  }

  async getByCar(carId) {
    return this.client.get(this.endpoint, { car: carId });
  }

  async getByType(serviceType) {
    return this.client.get(this.endpoint, { service_type: serviceType });
  }

  async getByDateRange(startDate, endDate) {
    return this.client.get(this.endpoint, { 
      start_date: startDate, 
      end_date: endDate 
    });
  }

  async getByStatus(status) {
    return this.client.get(this.endpoint, { status });
  }
}

export class ServiceTrigger extends BaseEntity {
  constructor() {
    super('/vehicles/service-triggers/');
  }

  async getOverdue() {
    return this.client.get(this.endpoint, { overdue: true });
  }

  async getByPriority(priority) {
    return this.client.get(this.endpoint, { priority });
  }

  async getByTriggerType(triggerType) {
    return this.client.get(this.endpoint, { trigger_type: triggerType });
  }

  async createBatch() {
    return this.client.post('/vehicles/service-triggers/create-batch/');
  }
}

export class VehicleWorkflow extends BaseEntity {
  constructor() {
    super('/vehicles/workflows/');
  }

  async getByStatus(workflowStatus) {
    return this.client.get(this.endpoint, { workflow_status: workflowStatus });
  }

  async getByStage(currentStage) {
    return this.client.get(this.endpoint, { current_stage: currentStage });
  }

  async getWithDamage() {
    return this.client.get(this.endpoint, { damage_flagged: true });
  }

  async advanceStage(workflowId) {
    return this.client.post(`/vehicles/workflows/${workflowId}/advance/`);
  }
}

export class DrivingCheck extends BaseEntity {
  constructor() {
    super('/vehicles/driving-checks/');
  }

  // Get driving checks by car
  async getByCar(carId) {
    return this.client.get(this.endpoint, { car: carId });
  }

  // Get driving checks by workflow
  async getByWorkflow(workflowId) {
    return this.client.get(this.endpoint, { workflow: workflowId });
  }

  // Get driving checks by status
  async getByStatus(status) {
    return this.client.get(this.endpoint, { status });
  }

  // Get driving checks by date range
  async getByDateRange(startDate, endDate) {
    return this.client.get(this.endpoint, {
      check_date__gte: startDate,
      check_date__lte: endDate
    });
  }

  // Get failed driving checks
  async getFailed() {
    return this.client.get(this.endpoint, { status: 'failed' });
  }

  // Get passed driving checks
  async getPassed() {
    return this.client.get(this.endpoint, { status: 'passed' });
  }

  // Get pending driving checks
  async getPending() {
    return this.client.get(this.endpoint, { status: 'pending' });
  }

  // Create a new driving check
  async createCheck(data) {
    return this.client.post(this.endpoint, {
      car_id: data.carId,
      workflow_id: data.workflowId,
      evaluator_name: data.evaluatorName,
      check_date: data.checkDate || new Date().toISOString(),
      engine_status: data.engineStatus || false,
      lights_working: data.lightsWorking || false,
      brakes_working: data.brakesWorking || false,
      steering_responsive: data.steeringResponsive || false,
      fluid_levels_ok: data.fluidLevelsOk || false,
      tire_condition_ok: data.tireConditionOk || false,
      mirrors_adjusted: data.mirrorsAdjusted || false,
      seatbelts_working: data.seatbeltsWorking || false,
      overall_status: data.overallStatus || 'pending',
      notes: data.notes || '',
      mileage_at_check: data.mileageAtCheck || 0
    });
  }

  // Update driving check status
  async updateStatus(id, status, notes = '') {
    return this.client.patch(`${this.endpoint}${id}/`, {
      overall_status: status,
      notes: notes
    });
  }

  // Mark driving check as passed
  async markPassed(id, notes = '') {
    return this.updateStatus(id, 'passed', notes);
  }

  // Mark driving check as failed
  async markFailed(id, notes = '') {
    return this.updateStatus(id, 'failed', notes);
  }

  // Get driving checks requiring attention
  async getRequiringAttention() {
    return this.client.get(this.endpoint, { 
      status__in: ['failed', 'requires_recheck'] 
    });
  }

  // Complete driving check with results
  async completeCheck(id, checkResults) {
    return this.client.patch(`${this.endpoint}${id}/`, {
      ...checkResults,
      check_date: new Date().toISOString(),
      overall_status: this.determineOverallStatus(checkResults)
    });
  }

  // Helper method to determine overall status based on individual checks
  determineOverallStatus(results) {
    const criticalChecks = [
      'engine_status', 'lights_working', 'brakes_working', 
      'steering_responsive', 'seatbelts_working'
    ];
    
    const failedCritical = criticalChecks.some(check => 
      results[check] === false || results[check] === 'failed'
    );
    
    if (failedCritical) {
      return 'failed';
    }
    
    const allChecks = [
      ...criticalChecks, 'fluid_levels_ok', 'tire_condition_ok', 'mirrors_adjusted'
    ];
    
    const allPassed = allChecks.every(check => 
      results[check] === true || results[check] === 'passed'
    );
    
    return allPassed ? 'passed' : 'requires_recheck';
  }
}

// Reservation Management Entities
export class Quote extends BaseEntity {
  constructor() {
    super('/reservations/quotes/');
  }

  async getByStatus(status) {
    return this.client.get(this.endpoint, { status });
  }

  async getByCustomer(customerName) {
    return this.client.get(this.endpoint, { customer_name: customerName });
  }

  async accept(id) {
    return this.client.post(`${this.endpoint}${id}/accept/`);
  }

  async sendToCustomer(id, email) {
    return this.client.post(`${this.endpoint}${id}/send/`, { email });
  }
}

export class Reservation extends BaseEntity {
  constructor() {
    super('/reservations/reservations/');
  }

  async getByStatus(status) {
    return this.client.get(this.endpoint, { status });
  }

  async getByDateRange(startDate, endDate) {
    return this.client.get(this.endpoint, {
      pickup_date__gte: startDate,
      dropoff_date__lte: endDate
    });
  }

  async getUpcoming() {
    const today = new Date().toISOString().split('T')[0];
    return this.client.get(this.endpoint, {
      pickup_date__gte: today,
      status: 'confirmed'
    });
  }

  async confirm(id) {
    return this.client.post(`${this.endpoint}${id}/confirm/`);
  }

  async cancel(id, reason) {
    return this.client.post(`${this.endpoint}${id}/cancel/`, { reason });
  }
}

export class CheckoutReport extends BaseEntity {
  constructor() {
    super('/reservations/checkout-reports/');
  }

  async getByCar(carId) {
    return this.client.get(this.endpoint, { car: carId });
  }

  async getByCustomer(customerName) {
    return this.client.get(this.endpoint, { customer_name: customerName });
  }

  async getByDateRange(startDate, endDate) {
    return this.client.get(this.endpoint, {
      checkout_date__gte: startDate,
      checkout_date__lte: endDate
    });
  }
}

export class Notification extends BaseEntity {
  constructor() {
    super('/system/notifications/');
  }

  // Get unread notifications
  async getUnread() {
    return this.client.get(this.endpoint, { read: false });
  }

  // Get notifications by type
  async getByType(notificationType) {
    return this.client.get(this.endpoint, { notification_type: notificationType });
  }

  // Get notifications by priority
  async getByPriority(priority) {
    return this.client.get(this.endpoint, { priority });
  }

  // Mark notification as read
  async markRead(id) {
    return this.client.patch(`${this.endpoint}${id}/`, { read: true });
  }

  // Mark all notifications as read
  async markAllRead() {
    return this.client.post(`${this.endpoint}mark-all-read/`);
  }

  // Delete notification
  async dismiss(id) {
    return this.client.delete(`${this.endpoint}${id}/`);
  }

  // Get notifications for current user
  async getMine() {
    return this.client.get(`${this.endpoint}mine/`);
  }

  // Create notification
  async create(notificationData) {
    return this.client.post(this.endpoint, {
      title: notificationData.title,
      message: notificationData.message,
      notification_type: notificationData.type || 'info',
      priority: notificationData.priority || 'medium',
      recipient_id: notificationData.recipientId,
      related_entity_type: notificationData.relatedEntityType,
      related_entity_id: notificationData.relatedEntityId,
      action_url: notificationData.actionUrl
    });
  }

  // Get service notifications
  async getServiceNotifications() {
    return this.client.get(this.endpoint, { notification_type: 'service' });
  }

  // Get reservation notifications
  async getReservationNotifications() {
    return this.client.get(this.endpoint, { notification_type: 'reservation' });
  }

  // Get system notifications
  async getSystemNotifications() {
    return this.client.get(this.endpoint, { notification_type: 'system' });
  }

  // Get high priority notifications
  async getHighPriority() {
    return this.client.get(this.endpoint, { priority: 'high' });
  }

  // Subscribe to notification type
  async subscribe(notificationType) {
    return this.client.post(`${this.endpoint}subscribe/`, {
      notification_type: notificationType
    });
  }

  // Unsubscribe from notification type
  async unsubscribe(notificationType) {
    return this.client.post(`${this.endpoint}unsubscribe/`, {
      notification_type: notificationType
    });
  }

  // Get notification preferences
  async getPreferences() {
    return this.client.get(`${this.endpoint}preferences/`);
  }

  // Update notification preferences
  async updatePreferences(preferences) {
    return this.client.patch(`${this.endpoint}preferences/`, preferences);
  }
}

export class PricingRule extends BaseEntity {
  constructor() {
    super('/vehicles/pricing-rules/');
  }

  // Get pricing rules by type
  async getByType(type) {
    return this.client.get(this.endpoint, { type });
  }

  // Get active pricing rules
  async getActive() {
    return this.client.get(this.endpoint, { active: true });
  }

  // Get insurance pricing rules
  async getInsuranceRules() {
    return this.client.get(this.endpoint, { type: 'insurance', active: true });
  }

  // Get KM allowance rules
  async getKmAllowanceRules() {
    return this.client.get(this.endpoint, { type: 'km_allowance', active: true });
  }

  // Get additional service rules
  async getAdditionalServiceRules() {
    return this.client.get(this.endpoint, { type: 'additional_service', active: true });
  }

  // Get rules by category
  async getByCategory(category) {
    return this.client.get(this.endpoint, { category });
  }

  // Get rules with daily rate adjustments
  async getWithDailyRates() {
    return this.client.get(this.endpoint, { has_daily_rate: true });
  }

  // Get rules with one-time fees
  async getWithOneTimeFees() {
    return this.client.get(this.endpoint, { has_one_time_fee: true });
  }

  // Calculate pricing for a specific rule and duration
  async calculatePrice(ruleId, duration, baseRate = 0) {
    return this.client.post(`${this.endpoint}${ruleId}/calculate/`, {
      duration,
      base_rate: baseRate
    });
  }

  // Get applicable rules for vehicle type
  async getForVehicleType(vehicleTypeId) {
    return this.client.get(this.endpoint, { 
      vehicle_type: vehicleTypeId,
      active: true 
    });
  }

  // Bulk calculate pricing for multiple rules
  async bulkCalculate(calculations) {
    return this.client.post(`${this.endpoint}bulk-calculate/`, {
      calculations
    });
  }
}

// Client Management Entities
export class Client extends BaseEntity {
  constructor() {
    super('/clients/clients/');
  }

  async getActive() {
    return this.client.get(this.endpoint, { active: true });
  }

  async getByType(clientType) {
    return this.client.get(this.endpoint, { client_type: clientType });
  }

  async getWithReservations(id) {
    return this.client.get(`${this.endpoint}${id}/`, { include_reservations: true });
  }
}

// Add these entities to your Vehicle Management section:

export class Invoice extends BaseEntity {
  constructor() {
    super('/invoices/invoices/');
  }

  async getByStatus(status) {
    return this.client.get(this.endpoint, { status });
  }

  async getByCustomer(customerName) {
    return this.client.get(this.endpoint, { customer_name: customerName });
  }

  async getByQuote(quoteId) {
    return this.client.get(this.endpoint, { quote_id: quoteId });
  }

  async markPaid(id, paymentDetails) {
    return this.client.post(`${this.endpoint}${id}/mark-paid/`, paymentDetails);
  }

  async sendToCustomer(id, email) {
    return this.client.post(`${this.endpoint}${id}/send/`, { email });
  }
}

export class ServiceSupplier extends BaseEntity {
  constructor() {
    super('/vehicles/service-suppliers/');
  }

  async getActive() {
    return this.client.get(this.endpoint, { active: true });
  }

  async getByServiceType(serviceType) {
    return this.client.get(this.endpoint, { service_type: serviceType });
  }

  async getWithRatings() {
    return this.client.get(this.endpoint, { include_ratings: true });
  }
}

export class ServiceBooking extends BaseEntity {
  constructor() {
    super('/vehicles/service-bookings/');
  }

  async getBySupplier(supplierId) {
    return this.client.get(this.endpoint, { supplier: supplierId });
  }

  async getByStatus(status) {
    return this.client.get(this.endpoint, { status });
  }

  async getByDateRange(startDate, endDate) {
    return this.client.get(this.endpoint, {
      booking_date__gte: startDate,
      booking_date__lte: endDate
    });
  }

  async confirm(id) {
    return this.client.post(`${this.endpoint}${id}/confirm/`);
  }

  async cancel(id, reason) {
    return this.client.post(`${this.endpoint}${id}/cancel/`, { reason });
  }
}

export class WeeklyServiceReport extends BaseEntity {
  constructor() {
    super('/vehicles/weekly-service-reports/');
  }

  async getByWeek(year, week) {
    return this.client.get(this.endpoint, { year, week });
  }

  async getCurrent() {
    return this.client.get(`${this.endpoint}current/`);
  }

  async generate(weekStartDate) {
    return this.client.post(`${this.endpoint}generate/`, { 
      week_start_date: weekStartDate 
    });
  }
}

export class GpsData extends BaseEntity {
  constructor() {
    super('/vehicles/gps-data/');
  }

  async getByCar(carId) {
    return this.client.get(this.endpoint, { car: carId });
  }

  async getByDateRange(carId, startDate, endDate) {
    return this.client.get(this.endpoint, {
      car: carId,
      timestamp__gte: startDate,
      timestamp__lte: endDate
    });
  }

  async getLatest(carId) {
    return this.client.get(`${this.endpoint}latest/`, { car: carId });
  }

  async getRoute(carId, startDate, endDate) {
    return this.client.get(`${this.endpoint}route/`, {
      car: carId,
      start_date: startDate,
      end_date: endDate
    });
  }
}

export class WashVisualCheck extends BaseEntity {
  constructor() {
    super('/vehicles/wash-visual-checks/');
  }

  // Get wash checks by car
  async getByCar(carId) {
    return this.client.get(this.endpoint, { car: carId });
  }

  // Get wash checks by workflow
  async getByWorkflow(workflowId) {
    return this.client.get(this.endpoint, { workflow: workflowId });
  }

  // Get wash checks by status
  async getByStatus(status) {
    return this.client.get(this.endpoint, { status });
  }

  // Get wash checks by date range
  async getByDateRange(startDate, endDate) {
    return this.client.get(this.endpoint, {
      check_date__gte: startDate,
      check_date__lte: endDate
    });
  }

  // Get failed wash checks
  async getFailed() {
    return this.client.get(this.endpoint, { status: 'failed' });
  }

  // Get passed wash checks
  async getPassed() {
    return this.client.get(this.endpoint, { status: 'passed' });
  }

  // Get pending wash checks
  async getPending() {
    return this.client.get(this.endpoint, { status: 'pending' });
  }

  // Create a new wash/visual check
  async createCheck(data) {
    return this.client.post(this.endpoint, {
      car_id: data.carId,
      workflow_id: data.workflowId,
      evaluator_name: data.evaluatorName,
      check_date: data.checkDate || new Date().toISOString(),
      exterior_clean: data.exteriorClean || false,
      interior_clean: data.interiorClean || false,
      windows_clean: data.windowsClean || false,
      tires_clean: data.tiresClean || false,
      dashboard_clean: data.dashboardClean || false,
      seats_clean: data.seatsClean || false,
      floor_mats_clean: data.floorMatsClean || false,
      trunk_clean: data.trunkClean || false,
      fuel_tank_full: data.fuelTankFull || false,
      visual_damage_check: data.visualDamageCheck || false,
      overall_cleanliness_rating: data.overallCleanlinessRating || 1,
      overall_status: data.overallStatus || 'pending',
      notes: data.notes || '',
      wash_completion_time: data.washCompletionTime,
      inspection_completion_time: data.inspectionCompletionTime
    });
  }

  // Update wash check status
  async updateStatus(id, status, notes = '') {
    return this.client.patch(`${this.endpoint}${id}/`, {
      overall_status: status,
      notes: notes
    });
  }

  // Mark wash check as passed
  async markPassed(id, notes = '') {
    return this.updateStatus(id, 'passed', notes);
  }

  // Mark wash check as failed
  async markFailed(id, notes = '') {
    return this.updateStatus(id, 'failed', notes);
  }

  // Get wash checks requiring attention
  async getRequiringAttention() {
    return this.client.get(this.endpoint, { 
      status__in: ['failed', 'requires_rewash'] 
    });
  }

  // Complete wash check with results
  async completeCheck(id, checkResults) {
    return this.client.patch(`${this.endpoint}${id}/`, {
      ...checkResults,
      check_date: new Date().toISOString(),
      overall_status: this.determineOverallStatus(checkResults)
    });
  }

  // Get wash efficiency stats
  async getEfficiencyStats(startDate, endDate) {
    return this.client.get(`${this.endpoint}efficiency-stats/`, {
      start_date: startDate,
      end_date: endDate
    });
  }

  // Helper method to determine overall status
  determineOverallStatus(results) {
    const criticalChecks = [
      'exterior_clean', 'interior_clean', 'windows_clean', 
      'visual_damage_check'
    ];
    
    const failedCritical = criticalChecks.some(check => 
      results[check] === false || results[check] === 'failed'
    );
    
    if (failedCritical) {
      return 'failed';
    }
    
    const cleanlinessRating = results.overall_cleanliness_rating || 1;
    if (cleanlinessRating < 3) {
      return 'requires_rewash';
    }
    
    return 'passed';
  }
}

export class ClientRateOverride extends BaseEntity {
  constructor() {
    super('/clients/rate-overrides/');
  }

  async getByClient(clientId) {
    return this.client.get(this.endpoint, { client: clientId });
  }

  async getByVehicleType(vehicleTypeId) {
    return this.client.get(this.endpoint, { vehicle_type: vehicleTypeId });
  }
}

// Dashboard and Statistics
export class Dashboard {
  constructor() {
    this.client = djangoClient;
  }

  async getVehicleDashboard() {
    return this.client.get('/vehicles/dashboard/');
  }

  async getLocationStats() {
    return this.client.get('/vehicles/stats/locations/');
  }

  async getServiceStats() {
    return this.client.get('/vehicles/stats/services/');
  }

  async getFleetOverview() {
    return this.client.get('/vehicles/overview/');
  }

  async getReservationStats() {
    return this.client.get('/reservations/stats/');
  }

  async getClientStats() {
    return this.client.get('/clients/stats/');
  }

  async getFinancialSummary() {
    return this.client.get('/reports/financial-summary/');
  }
}


// Entity instances - matching your base44 pattern
export const user = new User();
export const organization = new Organization();
export const themeSettings = new ThemeSettings();
export const navigationSettings = new NavigationSettings();
export const formConfiguration = new FormConfiguration();

export const location = new Location();
export const vehicleType = new VehicleType();
export const car = new Car();
export const serviceRecord = new ServiceRecord();
export const serviceTrigger = new ServiceTrigger();
export const vehicleWorkflow = new VehicleWorkflow();
export const drivingCheck = new DrivingCheck();

export const quote = new Quote();
export const reservation = new Reservation();
export const checkoutReport = new CheckoutReport();

export const client = new Client();
export const clientRateOverride = new ClientRateOverride();

export const dashboard = new Dashboard();

export const invoice = new Invoice();
export const serviceSupplier = new ServiceSupplier();
export const serviceBooking = new ServiceBooking();
export const weeklyServiceReport = new WeeklyServiceReport();
export const gpsData = new GpsData();
export const washVisualCheck = new WashVisualCheck();

// Default export with all entities (base44 style)
const entities = {
  // System Management
  User,
  Organization,
  ThemeSettings,
  NavigationSettings,
  FormConfiguration,
  Notification,
  
  // Vehicles
  Location,
  VehicleType,
  Car,
  ServiceRecord,
  ServiceTrigger,
  VehicleWorkflow,
  DrivingCheck, // Add this line
  
  // Reservations
  Quote,
  Reservation,
  CheckoutReport,
  
  // Clients
  Client,
  ClientRateOverride,
  
  // Dashboard
  Dashboard,
  
  // Instances
  user,
  organization,
  themeSettings,
  navigationSettings,
  formConfiguration,
  location,
  vehicleType,
  car,
  serviceRecord,
  serviceTrigger,
  vehicleWorkflow,
  drivingCheck, // Add this line
  quote,
  reservation,
  checkoutReport,
  client,
  clientRateOverride,
  dashboard,
  Notification,
  gpsData,
  quote,
  reservation,
  checkoutReport,
  invoice,
  client,
  clientRateOverride,
  dashboard,
  WashVisualCheck
};
export default entities;