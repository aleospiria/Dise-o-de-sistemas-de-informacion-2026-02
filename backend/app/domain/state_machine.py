from app.domain.enums import ResourceCondition, ResourceStatus

RESOURCE_TRANSITIONS: dict[ResourceStatus, tuple[ResourceStatus, ...]] = {
    ResourceStatus.DISPONIBLE: (
        ResourceStatus.RESERVADO,
        ResourceStatus.EN_MANTENIMIENTO,
        ResourceStatus.DADO_DE_BAJA,
    ),
    ResourceStatus.RESERVADO: (
        ResourceStatus.EN_PRESTAMO,
        ResourceStatus.DISPONIBLE,
        ResourceStatus.EN_MANTENIMIENTO,
    ),
    ResourceStatus.EN_PRESTAMO: (
        ResourceStatus.DISPONIBLE,
        ResourceStatus.EN_MANTENIMIENTO,
    ),
    ResourceStatus.EN_MANTENIMIENTO: (
        ResourceStatus.DISPONIBLE,
        ResourceStatus.DADO_DE_BAJA,
    ),
    ResourceStatus.DADO_DE_BAJA: (),
}

RETURN_CONDITION_STRATEGY: dict[ResourceCondition, ResourceStatus] = {
    ResourceCondition.BUENO: ResourceStatus.DISPONIBLE,
    ResourceCondition.REGULAR: ResourceStatus.DISPONIBLE,
    ResourceCondition.DANADO: ResourceStatus.EN_MANTENIMIENTO,
}


def is_valid_transition(origin: ResourceStatus, destination: ResourceStatus) -> bool:
    return destination in RESOURCE_TRANSITIONS[origin]
