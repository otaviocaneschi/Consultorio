-- Migration: Add weight and height to patients table

ALTER TABLE public.patients 
ADD COLUMN weight text,
ADD COLUMN height text;
