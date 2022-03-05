FROM ubuntu:21.10

ARG AK_ROOT=/home/robmc/opt/akinizer

# Configure and install base system
ENV DEBIAN_FRONTEND="noninteractive"
ENV TZ="America/Los_Angeles"
RUN \
    apt-get update && \
    apt-get upgrade -y && \
    apt-get install -y curl git htop python3 rsync sudo tzdata vim

# Add 'robmc' user
RUN \
    useradd --create-home --shell /bin/bash robmc && \
    usermod --append --groups sudo robmc && \
    echo "abc123\nabc123" | passwd robmc && \
    echo "Set disable_coredump false" >> /etc/sudo.conf

# Bootstrap system, compile node_modules for Linux. (Note: ./node_modules/ is
# excluded by way of the .dockerignore file)
USER robmc
RUN mkdir -p ${AK_ROOT}
COPY --chown=robmc:robmc . ${AK_ROOT}
WORKDIR ${AK_ROOT}
RUN AK_INSTALL_ROOT=${AK_ROOT} AK_SKIP_CLONE=yes bash bootstrap.sh

# Set interactive entrypoint conditions
USER robmc
WORKDIR /home/robmc/
COPY --chown=robmc:robmc ./deploy .
RUN echo "${AK_ROOT}" > .akroot
ENTRYPOINT /bin/bash
