<?php

use App\Services\DemoCatalogService;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Artisan::command('catalog:ensure-demo', function (DemoCatalogService $catalogService) {
    $created = $catalogService->ensureCatalogAvailable();

    if ($created === 0) {
        $this->info('Catalogo preservado: nenhum imovel demo precisou ser recriado.');

        return;
    }

    $this->info("Catalogo demo garantido com {$created} imovel(is) criado(s).");
})->purpose('Garante o catalogo demo apenas quando a tabela de imoveis estiver vazia');
