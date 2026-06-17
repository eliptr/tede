import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly API = environment.apiUrl;

  constructor(private http: HttpClient) {}

  // Auth
  login(body: any) { return this.http.post<any>(`${this.API}/auth/login`, body); }
  register(body: any) { return this.http.post<any>(`${this.API}/auth/register`, body); }
  getProfile() { return this.http.get<any>(`${this.API}/auth/profile`); }

  // Users (admin)
  getUsers(page = 1, limit = 20) { return this.http.get<any>(`${this.API}/users?page=${page}&limit=${limit}`); }
  getPendingUsers() { return this.http.get<any[]>(`${this.API}/users/pending`); }
  getUser(id: number) { return this.http.get<any>(`${this.API}/users/${id}`); }
  updateUserStatus(id: number, status: string) { return this.http.patch<any>(`${this.API}/users/${id}/status`, { status }); }
  updateUserRole(id: number, role: string) { return this.http.patch<any>(`${this.API}/users/${id}/role`, { role }); }

  // Events
  getEvents(filter: any = {}) {
    let params = new HttpParams();
    Object.entries(filter).forEach(([k, v]) => { if (v != null && v !== '') params = params.set(k, String(v)); });
    return this.http.get<any>(`${this.API}/events`, { params });
  }
  getEvent(id: number) { return this.http.get<any>(`${this.API}/events/${id}`); }
  getMyEvents(page = 1, limit = 10) {
    return this.http.get<any>(`${this.API}/events/organizer/my-events?page=${page}&limit=${limit}`);
  }
  getCategories() { return this.http.get<string[]>(`${this.API}/events/categories`); }
  createEvent(body: any) { return this.http.post<any>(`${this.API}/events`, body); }
  updateEvent(id: number, body: any) { return this.http.patch<any>(`${this.API}/events/${id}`, body); }
  publishEvent(id: number) { return this.http.patch<any>(`${this.API}/events/${id}/publish`, {}); }
  cancelEvent(id: number) { return this.http.patch<any>(`${this.API}/events/${id}/cancel`, {}); }
  deleteEvent(id: number) { return this.http.delete<any>(`${this.API}/events/${id}`); }
  getEventBookings(id: number, page = 1, limit = 10) {
    return this.http.get<any>(`${this.API}/events/${id}/bookings?page=${page}&limit=${limit}`);
  }
  uploadEventPhotos(id: number, files: FileList) {
    const fd = new FormData();
    Array.from(files).forEach((f) => fd.append('photos', f));
    return this.http.post<any>(`${this.API}/events/${id}/photos`, fd);
  }

  // Bookings
  createBooking(body: any) { return this.http.post<any>(`${this.API}/bookings`, body); }
  getMyBookings() { return this.http.get<any[]>(`${this.API}/bookings/my`); }
  getBooking(id: number) { return this.http.get<any>(`${this.API}/bookings/${id}`); }

  // Messages
  sendMessage(body: any) { return this.http.post<any>(`${this.API}/messages`, body); }
  getInbox() { return this.http.get<any[]>(`${this.API}/messages/inbox`); }
  getSent() { return this.http.get<any[]>(`${this.API}/messages/sent`); }
  getUnreadCount() { return this.http.get<{ count: number }>(`${this.API}/messages/unread-count`); }
  markRead(id: number) { return this.http.patch<any>(`${this.API}/messages/${id}/read`, {}); }
  deleteInboxMessage(id: number) { return this.http.delete<any>(`${this.API}/messages/inbox/${id}`); }
  deleteSentMessage(id: number) { return this.http.delete<any>(`${this.API}/messages/sent/${id}`); }

  // Recommendations
  getRecommendations(page = 1, limit = 6) {
    return this.http.get<any>(`${this.API}/recommendations?page=${page}&limit=${limit}`);
  }

  // Export
  exportJson() { return this.http.get(`${this.API}/export/json`, { responseType: 'blob' }); }
  exportXml() { return this.http.get(`${this.API}/export/xml`, { responseType: 'blob' }); }
}
