-- Seed example for Uge 33 based on provided content
do $$
declare v_insight_id uuid;
begin
  insert into public.weekly_insights (week_year, week_number, title, intro, published_at)
  values (
    extract(year from now())::int, 33,
    'Uge 33: De seneste jobopslag peger på bevægelse i økonomifunktionen',
    'Flere virksomheder er i bevægelse med rekrutteringer, der kan signalere travlhed, vækst eller organisationsændringer i økonomifunktionen. Her er de mest relevante observationer fra uge 33:',
    now()
  )
  returning id into v_insight_id;

  -- Blue Line
  insert into public.weekly_insight_items (insight_id, position, company, summary, highlights)
  values (
    v_insight_id, 1, 'Blue Line',
    'Nyoprettet CFO-stilling efter lederafgang midt i international vækst. Det indikerer styrkelse af strategisk og operationel styring af økonomifunktionen.',
    array['Chief Financial Officer – nyoprettet nøgleposition i ledelsen hos Blue Line']
  );

  -- Blue Water Shipping
  insert into public.weekly_insight_items (insight_id, position, company, summary, highlights)
  values (
    v_insight_id, 2, 'Blue Water Shipping',
    'Flere rekrutteringer til økonomiafdelingen (bl.a. barselsvikariat og controllerroller). Aktiviteten peger på høj belastning, mulig integration af opkøb og øget transaktionsvolumen.',
    array['Debitorbogholder - barselsvikariat','Debitorbogholder med sans for god kundeservice','Kreditor Controller, Blue Water Shipping, Esbjerg']
  );

  -- SulfiLogger
  insert into public.weekly_insight_items (insight_id, position, company, summary, highlights)
  values (
    v_insight_id, 3, 'SulfiLogger',
    'Scale-up i cleantech ansætter første økonomichef efter kapitalrejsning. Økonomifunktion og rapportering etableres fra bunden.',
    array['Økonomichef til scale-up']
  );

  -- Søstrene Grene
  insert into public.weekly_insight_items (insight_id, position, company, summary, highlights)
  values (
    v_insight_id, 4, 'Søstrene Grene',
    'Flere økonomirelaterede stillinger midt i global ekspansion. Tyder på opbygning af FP&A-kapacitet og styrkelse af backoffice til at understøtte vækst.',
    array['Senior Business Controller','Student Assistant, Finance','Accounting Assistant']
  );
end $$;

