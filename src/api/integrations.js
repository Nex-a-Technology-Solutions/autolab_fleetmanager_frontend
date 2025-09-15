// integrations.js - Integration services for Django API
import djangoClient from './djangoClient';

// Base Integration class
class BaseIntegration {
  constructor(endpoint) {
    this.endpoint = endpoint;
    this.client = djangoClient;
  }

  async execute(data) {
    return this.client.post(this.endpoint, data);
  }
}

export class CalendarHelper extends BaseIntegration {
  constructor() {
    super('/integrations/calendar/');
  }

  // Get available time slots for reservations
  async getAvailableSlots(startDate, endDate, vehicleTypeId = null) {
    return this.execute({
      action: 'get_available_slots',
      start_date: startDate,
      end_date: endDate,
      vehicle_type_id: vehicleTypeId
    });
  }

  // Check vehicle availability for specific dates
  async checkVehicleAvailability(vehicleId, startDate, endDate) {
    return this.execute({
      action: 'check_vehicle_availability',
      vehicle_id: vehicleId,
      start_date: startDate,
      end_date: endDate
    });
  }

  // Schedule a service appointment
  async scheduleService(serviceData) {
    return this.execute({
      action: 'schedule_service',
      vehicle_id: serviceData.vehicleId,
      service_type: serviceData.serviceType,
      scheduled_date: serviceData.scheduledDate,
      duration_hours: serviceData.durationHours || 2,
      mechanic_name: serviceData.mechanicName,
      notes: serviceData.notes
    });
  }

  // Get calendar events for a date range
  async getEvents(startDate, endDate, eventType = null) {
    return this.execute({
      action: 'get_events',
      start_date: startDate,
      end_date: endDate,
      event_type: eventType
    });
  }

  // Create a calendar event
  async createEvent(eventData) {
    return this.execute({
      action: 'create_event',
      title: eventData.title,
      start_date: eventData.startDate,
      end_date: eventData.endDate,
      event_type: eventData.eventType,
      vehicle_id: eventData.vehicleId,
      customer_name: eventData.customerName,
      description: eventData.description
    });
  }

  // Update a calendar event
  async updateEvent(eventId, eventData) {
    return this.execute({
      action: 'update_event',
      event_id: eventId,
      ...eventData
    });
  }

  // Delete a calendar event
  async deleteEvent(eventId) {
    return this.execute({
      action: 'delete_event',
      event_id: eventId
    });
  }

  // Get upcoming reservations
  async getUpcomingReservations(days = 7) {
    return this.execute({
      action: 'get_upcoming_reservations',
      days_ahead: days
    });
  }

  // Get service schedule
  async getServiceSchedule(startDate, endDate) {
    return this.execute({
      action: 'get_service_schedule',
      start_date: startDate,
      end_date: endDate
    });
  }
}

// Core Integration Services (replacing base44 integrations)
export class InvokeLLM extends BaseIntegration {
  constructor() {
    super('/integrations/llm/invoke/');
  }

  async generateText(prompt, options = {}) {
    return this.execute({
      prompt,
      model: options.model || 'gpt-3.5-turbo',
      max_tokens: options.maxTokens || 1000,
      temperature: options.temperature || 0.7,
      ...options
    });
  }

  async analyzeText(text, analysisType = 'sentiment') {
    return this.execute({
      text,
      analysis_type: analysisType
    });
  }

  async generateQuote(quoteData) {
    return this.execute({
      action: 'generate_quote',
      data: quoteData
    });
  }

  async analyzeVehicleDamage(damageDescription, images = []) {
    return this.execute({
      action: 'analyze_damage',
      description: damageDescription,
      images
    });
  }

  async generateServiceReport(serviceData) {
    return this.execute({
      action: 'generate_service_report',
      data: serviceData
    });
  }
}

export class SendEmail extends BaseIntegration {
  constructor() {
    super('/integrations/email/send/');
  }

  async send(emailData) {
    return this.execute({
      to: emailData.to,
      subject: emailData.subject,
      body: emailData.body,
      html: emailData.html,
      cc: emailData.cc || [],
      bcc: emailData.bcc || [],
      attachments: emailData.attachments || []
    });
  }

  async sendQuote(quoteId, recipientEmail, customMessage = '') {
    return this.execute({
      action: 'send_quote',
      quote_id: quoteId,
      recipient: recipientEmail,
      custom_message: customMessage
    });
  }

  async sendReservationConfirmation(reservationId, recipientEmail) {
    return this.execute({
      action: 'send_reservation_confirmation',
      reservation_id: reservationId,
      recipient: recipientEmail
    });
  }

  async sendServiceReminder(serviceTriggerId, recipientEmail) {
    return this.execute({
      action: 'send_service_reminder',
      service_trigger_id: serviceTriggerId,
      recipient: recipientEmail
    });
  }

  async sendCheckoutReminder(reservationId, recipientEmail, hoursBeforePickup = 24) {
    return this.execute({
      action: 'send_checkout_reminder',
      reservation_id: reservationId,
      recipient: recipientEmail,
      hours_before: hoursBeforePickup
    });
  }

  async sendWelcomeEmail(userId) {
    return this.execute({
      action: 'send_welcome',
      user_id: userId
    });
  }

  async sendPasswordReset(email) {
    return this.execute({
      action: 'send_password_reset',
      email: email
    });
  }
}

export class UploadFile extends BaseIntegration {
  constructor() {
    super('/integrations/files/upload/');
  }

  async upload(file, options = {}) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', options.folder || 'general');
    formData.append('public', options.public || false);
    formData.append('description', options.description || '');

    return this.client.uploadFile(this.endpoint, formData, options.onProgress);
  }

  async uploadMultiple(files, options = {}) {
    const formData = new FormData();
    files.forEach((file, index) => {
      formData.append(`file_${index}`, file);
    });
    formData.append('folder', options.folder || 'general');
    formData.append('public', options.public || false);

    return this.client.uploadFile(this.endpoint, formData, options.onProgress);
  }

  async uploadVehicleImage(vehicleId, file, imageType = 'general') {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('vehicle_id', vehicleId);
    formData.append('image_type', imageType);

    return this.client.uploadFile('/integrations/files/upload/vehicle-image/', formData);
  }

  async uploadCheckoutPhoto(checkoutReportId, file, damageType = 'general') {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('checkout_report_id', checkoutReportId);
    formData.append('damage_type', damageType);

    return this.client.uploadFile('/integrations/files/upload/checkout-photo/', formData);
  }

  async uploadServiceDocument(serviceRecordId, file, documentType = 'invoice') {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('service_record_id', serviceRecordId);
    formData.append('document_type', documentType);

    return this.client.uploadFile('/integrations/files/upload/service-document/', formData);
  }
}

export class GenerateImage extends BaseIntegration {
  constructor() {
    super('/integrations/images/generate/');
  }

  async generate(prompt, options = {}) {
    return this.execute({
      prompt,
      style: options.style || 'realistic',
      size: options.size || '1024x1024',
      quality: options.quality || 'standard',
      model: options.model || 'dall-e-3'
    });
  }

  async generateVehicleDiagram(vehicleType, damagePoints = []) {
    return this.execute({
      action: 'generate_vehicle_diagram',
      vehicle_type: vehicleType,
      damage_points: damagePoints
    });
  }

  async generateQRCode(data, options = {}) {
    return this.execute({
      action: 'generate_qr_code',
      data: data,
      size: options.size || 256,
      error_correction: options.errorCorrection || 'M'
    });
  }

  async generateBarcode(data, format = 'CODE128') {
    return this.execute({
      action: 'generate_barcode',
      data: data,
      format: format
    });
  }
}

export class ExtractDataFromUploadedFile extends BaseIntegration {
  constructor() {
    super('/integrations/files/extract/');
  }

  async extract(fileId, extractionType = 'text') {
    return this.execute({
      file_id: fileId,
      extraction_type: extractionType
    });
  }

  async extractText(fileId) {
    return this.extract(fileId, 'text');
  }

  async extractMetadata(fileId) {
    return this.extract(fileId, 'metadata');
  }

  async extractVehicleInfo(fileId) {
    return this.execute({
      file_id: fileId,
      action: 'extract_vehicle_info'
    });
  }

  async extractServiceData(fileId) {
    return this.execute({
      file_id: fileId,
      action: 'extract_service_data'
    });
  }

  async parseInvoice(fileId) {
    return this.execute({
      file_id: fileId,
      action: 'parse_invoice'
    });
  }

  async extractClientData(fileId) {
    return this.execute({
      file_id: fileId,
      action: 'extract_client_data'
    });
  }
}

export class CreateFileSignedUrl extends BaseIntegration {
  constructor() {
    super('/integrations/files/signed-url/');
  }

  async create(fileName, contentType, expirationMinutes = 60) {
    return this.execute({
      file_name: fileName,
      content_type: contentType,
      expiration_minutes: expirationMinutes
    });
  }

  async createForUpload(fileName, contentType, folder = 'general') {
    return this.execute({
      action: 'create_upload_url',
      file_name: fileName,
      content_type: contentType,
      folder: folder
    });
  }

  async createForDownload(fileId, expirationMinutes = 60) {
    return this.execute({
      action: 'create_download_url',
      file_id: fileId,
      expiration_minutes: expirationMinutes
    });
  }
}

export class UploadPrivateFile extends BaseIntegration {
  constructor() {
    super('/integrations/files/upload/private/');
  }

  async upload(file, options = {}) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', options.folder || 'private');
    formData.append('description', options.description || '');

    return this.client.uploadFile(this.endpoint, formData, options.onProgress);
  }
}

const integrations = {
  llm: new InvokeLLM(),
  email: new SendEmail(),
  fileUpload: new UploadFile(),
  imageGen: new GenerateImage(),
  dataExtract: new ExtractDataFromUploadedFile(),
  signedUrl: new CreateFileSignedUrl(),
  privateFileUpload: new UploadPrivateFile(),
  calendar: new CalendarHelper() // Add this line
};

export default integrations;