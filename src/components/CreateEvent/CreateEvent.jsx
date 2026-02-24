import React, { useRef } from "react";
import "./CreateEvent.css";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "../../i18n/LanguageContext";
import { useAuth } from "../../context/AuthContext";
import { supabase } from "../../lib/supabase";
import { eventToDbRow } from "../../lib/mapEvent";
import { toast } from "sonner";
import ImageUpload from "./ImageUpload";

const SWEDISH_CITIES = [
    "Stockholm",
    "Göteborg",
    "Malmö",
    "Uppsala",
    "Linköping",
    "Örebro",
    "Västerås",
    "Helsingborg",
    "Norrköping",
    "Jönköping",
];

function getTomorrow() {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
}

const MAX_DESCRIPTION = 600;

export default function CreateEvent({ events, setEvents }) {
    const navigate = useNavigate();
    const { t } = useLanguage();
    const { user } = useAuth();
    const [submitting, setSubmitting] = useState(false);
    const descriptionRef = useRef(null);
    const [formData, setFormData] = useState({
        eventName: '',
        type: '',
        date: getTomorrow(),
        startTime: '18:00',
        endTime: '',
        venue: '',
        city: 'Stockholm',
        address: '',
        organizerName: '',
        organizerEmail: '',
        price: '',
        capacity: '',
        description: '',
        url: '',
        img: '',
        hostType: 'private'
    });
    


    const generateId = () => {
        const timestamp = Date.now().toString(36);
        const randomStr = Math.random().toString(36).substr(2, 5);
        return `evt_${timestamp}_${randomStr}`;
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleDescriptionChange = (e) => {
        const value = e.target.value.slice(0, MAX_DESCRIPTION);
        setFormData(prev => ({ ...prev, description: value }));
        // auto-grow
        const el = descriptionRef.current;
        if (el) {
            el.style.height = 'auto';
            el.style.height = el.scrollHeight + 'px';
        }
    };

    async function handleSubmit(event) {
        event.preventDefault();
        setSubmitting(true);

        const newEvent = {
            id: generateId(),
            eventName: formData.eventName,
            type: formData.type,
            img: formData.img || "https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=2940&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
            date: formData.date,
            startTime: formData.startTime,
            endTime: formData.endTime,
            location: {
                venue: formData.venue,
                address: formData.address,
                city: formData.city,
                state: "",
                postalCode: "",
                country: "Sweden"
            },
            organizer: {
                name: formData.organizerName,
                email: formData.organizerEmail,
                phone: ""
            },
            price: {
                currency: "SEK",
                amount: formData.price ? parseInt(formData.price) : 0
            },
            capacity: parseInt(formData.capacity) || 50,
            availableSpots: parseInt(formData.capacity) || 50,
            description: formData.description,
            tags: [formData.type.toLowerCase()],
            hosts: [formData.organizerName],
            status: "active",
            source: "user",
            hostType: formData.hostType,
            url: formData.url || null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        try {
            const dbRow = { ...eventToDbRow(newEvent), created_by: user?.id ?? null };
            const { error } = await supabase.from("events").insert(dbRow);
            if (error) throw new Error(error.message);
        } catch (err) {
            toast.error(err.message || 'Failed to save event. Please try again.');
            setSubmitting(false);
            return;
        }

        // Only reach here on success
        toast.success(`"${newEvent.eventName}" has been created!`);
        setEvents([...events, newEvent]);
        setSubmitting(false);
        navigate('/');
    }

   

  return (
    <div className="create-event-container">
      <h1>{t('createEvent.title')}</h1>
      <form className="create-event-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="eventName">{t('createEvent.eventName')}</label>
          <input 
            type="text" 
            id="eventName" 
            name="eventName" 
            value={formData.eventName}
            onChange={handleInputChange}
            required 
          />
        </div>

        <div className="form-group">
          <label htmlFor="type">{t('createEvent.category')}</label>
          <select
            id="type"
            name="type"
            value={formData.type}
            onChange={handleInputChange}
            required
          >
            <option value="">{t('createEvent.selectCategory')}</option>
            <option value="Live Music">{t('eventTypes.liveMusic')}</option>
            <option value="Theatre">{t('eventTypes.theatre')}</option>
            <option value="Art Exhibition">{t('eventTypes.artExhibition')}</option>
            <option value="Film & Media">{t('eventTypes.filmMedia')}</option>
            <option value="Nightlife">{t('eventTypes.nightlife')}</option>
            <option value="Festival">{t('eventTypes.festival')}</option>
            <option value="Food & Drink">{t('eventTypes.foodDrink')}</option>
            <option value="Sports">{t('eventTypes.sports')}</option>
            <option value="Family">{t('eventTypes.family')}</option>
            <option value="Conference">{t('eventTypes.conference')}</option>
            <option value="Business">{t('eventTypes.business')}</option>
            <option value="Health & Wellness">{t('eventTypes.healthWellness')}</option>
            <option value="Literature">{t('eventTypes.literature')}</option>
            <option value="Environment">{t('eventTypes.environment')}</option>
            <option value="Startup Pitch">{t('eventTypes.startupPitch')}</option>
            <option value="Build Night">{t('eventTypes.buildNight')}</option>
            <option value="Other">{t('eventTypes.other')}</option>
          </select>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="date">{t('createEvent.date')}</label>
            <input 
              type="date" 
              id="date" 
              name="date" 
              value={formData.date}
              onChange={handleInputChange}
              required 
            />
          </div>
          <div className="form-group">
            <label htmlFor="startTime">{t('createEvent.startTime')}</label>
            <input 
              type="time" 
              id="startTime" 
              name="startTime" 
              value={formData.startTime}
              onChange={handleInputChange}
              required 
            />
          </div>
          <div className="form-group">
            <label htmlFor="endTime">{t('createEvent.endTime')}</label>
            <input
              type="time"
              id="endTime"
              name="endTime"
              value={formData.endTime}
              onChange={handleInputChange}
            />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="venue">{t('createEvent.venue')}</label>
          <input
            type="text"
            id="venue"
            name="venue"
            value={formData.venue}
            onChange={handleInputChange}
            placeholder={t('createEvent.venuePlaceholder')}
            required
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="city">{t('createEvent.city')}</label>
            <select
              id="city"
              name="city"
              value={formData.city}
              onChange={handleInputChange}
              required
            >
              <option value="">{t('createEvent.selectCity')}</option>
              {SWEDISH_CITIES.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="address">{t('createEvent.address')}</label>
            <input
              type="text"
              id="address"
              name="address"
              value={formData.address}
              onChange={handleInputChange}
              placeholder={t('createEvent.addressPlaceholder')}
              required
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="organizerName">{t('createEvent.organizer')}</label>
            <input 
              type="text" 
              id="organizerName" 
              name="organizerName" 
              value={formData.organizerName}
              onChange={handleInputChange}
              required 
            />
          </div>
          <div className="form-group">
            <label htmlFor="organizerEmail">{t('createEvent.email')}</label>
            <input 
              type="email" 
              id="organizerEmail" 
              name="organizerEmail" 
              value={formData.organizerEmail}
              onChange={handleInputChange}
              required 
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="price">{t('createEvent.price')}</label>
            <input
              type="number"
              id="price"
              name="price"
              value={formData.price}
              onChange={handleInputChange}
              min="0"
              placeholder={t('createEvent.pricePlaceholder')}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="capacity">{t('createEvent.capacity')}</label>
            <input
              type="number"
              id="capacity"
              name="capacity"
              value={formData.capacity}
              onChange={handleInputChange}
              min="1"
              placeholder={t('createEvent.capacityPlaceholder')}
            />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="description">{t('createEvent.description')}</label>
          <textarea
            ref={descriptionRef}
            id="description"
            name="description"
            value={formData.description}
            onChange={handleDescriptionChange}
            rows="3"
            placeholder={t('createEvent.descriptionPlaceholder')}
            required
          />
          <div className="textarea-footer">
            <span className={`char-count${formData.description.length >= MAX_DESCRIPTION ? ' at-limit' : formData.description.length >= MAX_DESCRIPTION * 0.85 ? ' near-limit' : ''}`}>
              {formData.description.length}/{MAX_DESCRIPTION}
            </span>
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="url">{t('createEvent.ticketUrl')}</label>
          <input
            type="url"
            id="url"
            name="url"
            value={formData.url}
            onChange={handleInputChange}
            placeholder={t('createEvent.ticketUrlPlaceholder')}
          />
          <small>{t('createEvent.ticketUrlNote')}</small>
        </div>

        <div className="form-group">
          <label>{t('createEvent.hostType')}</label>
          <div className="host-type-options">
            <label className={`host-type-option${formData.hostType === 'private' ? ' selected' : ''}`}>
              <input
                type="radio"
                name="hostType"
                value="private"
                checked={formData.hostType === 'private'}
                onChange={handleInputChange}
              />
              {t('createEvent.hostTypePrivate')}
            </label>
            <label className={`host-type-option${formData.hostType === 'organizer' ? ' selected' : ''}`}>
              <input
                type="radio"
                name="hostType"
                value="organizer"
                checked={formData.hostType === 'organizer'}
                onChange={handleInputChange}
              />
              {t('createEvent.hostTypeOrganizer')}
            </label>
          </div>
        </div>

        <div className="form-group">
          <label>{t('createEvent.imageUrl')}</label>
          <ImageUpload
            value={formData.img}
            onChange={(url) => setFormData(prev => ({ ...prev, img: url }))}
          />
        </div>

        <div className="form-actions">
          <button type="button" className="btn-secondary" onClick={() => navigate('/')} disabled={submitting}>
            {t('createEvent.cancel')}
          </button>
          <button type="submit" className="btn-primary" disabled={submitting}>
            {submitting ? t('createEvent.saving') || 'Saving...' : t('createEvent.create')}
          </button>
        </div>
      </form>
      <div className="events-preview">
        <h3>{t('createEvent.recentEvents')}</h3>
        <div className="events-list">
          {events.slice(-3).reverse().map((event) => (
            <div key={event.id} className="event-preview-card">
              <img src={event.img} alt={event.eventName} className="preview-image" />
              <div className="preview-content">
                <h4>{event.eventName}</h4>
                <p className="preview-details">
                  {event.date} • {event.location?.city} • {event.type}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

